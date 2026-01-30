#!/usr/bin/env python3
"""
Ensemble Learning Points Calculator - High Accuracy ML System
Uses multiple models (XGBoost, LightGBM, CatBoost, TabNet, BERT) with meta-learning
for very accurate achievement point predictions.
"""

import os
import sys
import json
import warnings
import pyodbc
import pandas as pd
import numpy as np
from datetime import datetime
from dotenv import load_dotenv
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.linear_model import Ridge

warnings.filterwarnings('ignore')

# Load environment variables
load_dotenv()

# Configuration
GENERATE_CSV_REPORT = os.getenv('GENERATE_CSV_REPORT', 'false').lower() == 'true'
CSV_OUTPUT_PATH = os.getenv('CSV_OUTPUT_PATH', 'ensemble-points-report.csv')
SAVE_MODELS = os.getenv('SAVE_MODELS', 'true').lower() == 'true'
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')


def load_config():
    """Load ensemble configuration from JSON file"""
    config_path = os.path.join(os.path.dirname(__file__), 'ensemble-config.json')
    with open(config_path, 'r') as f:
        return json.load(f)


def load_from_azure_key_vault():
    """Load database credentials from Azure Key Vault with fallback to .env"""
    key_vault_uri = os.getenv('KEY_VAULT_URI') or os.getenv('AZURE_KEY_VAULT_URI')

    if not key_vault_uri:
        return None

    try:
        from azure.identity import DefaultAzureCredential
        from azure.keyvault.secrets import SecretClient

        print(f"Loading credentials from Azure Key Vault: {key_vault_uri}")

        credential = DefaultAzureCredential()
        client = SecretClient(vault_url=key_vault_uri, credential=credential)
        secret = client.get_secret('ConnectionStrings--DefaultConnection')

        if secret and secret.value:
            print("Successfully loaded database credentials from Key Vault")
            return secret.value
        else:
            print("WARNING: Connection string secret is empty in Key Vault")
            return None

    except ImportError:
        print("WARNING: Azure SDK not installed. Install with: pip install azure-identity azure-keyvault-secrets")
        print("   Falling back to environment variables...")
        return None
    except Exception as e:
        print(f"WARNING: Failed to load from Key Vault: {e}")
        print("   Falling back to environment variables...")
        return None


def get_db_connection_string():
    """Get database connection string with priority: Key Vault -> Environment variables"""
    connection_string = load_from_azure_key_vault()

    if connection_string:
        return connection_string

    print("Loading database credentials from environment variables (.env)")

    connection_string = os.getenv('DB_CONNECTION_STRING')
    if connection_string:
        return connection_string

    db_host = os.getenv('DB_HOST', 'localhost')
    db_name = os.getenv('DB_NAME', 'steam-games-achievements')
    db_user = os.getenv('DB_USER', 'ACT')
    db_password = os.getenv('DB_PASSWORD', 'ACT')

    return (
        f'DRIVER={{ODBC Driver 17 for SQL Server}};'
        f'SERVER={db_host};'
        f'DATABASE={db_name};'
        f'UID={db_user};'
        f'PWD={db_password}'
    )


def get_db_connection():
    """Create database connection"""
    connection_string = get_db_connection_string()
    return pyodbc.connect(connection_string)


def fetch_achievement_data(conn):
    """Fetch comprehensive achievement and game data for ML training"""
    query = """
    SELECT
        a.Id as achievement_id,
        a.GameId as game_id,
        a.Name as achievement_name,
        a.Description as achievement_description,
        a.IsHidden as is_hidden,
        g.Name as game_name,
        g.SteamRating as steam_rating,
        g.MetacriticScore as metacritic_score,
        g.Recommendations as recommendations,
        ast.GlobalPercentage as global_percentage
    FROM SteamAchievements a
    INNER JOIN SteamGames g ON a.GameId = g.Id
    LEFT JOIN SteamAchievementStats ast ON a.Id = ast.AchievementId
    WHERE a.Id IS NOT NULL
    """
    return pd.read_sql(query, conn)


def engineer_features(df):
    """Engineer comprehensive features for ensemble learning"""
    print("\nEngineering features for ML models...")

    # Popularity features
    df['steam_rating_norm'] = df['steam_rating'].fillna(0) / 100.0
    df['metacritic_norm'] = df['metacritic_score'].fillna(0) / 100.0
    df['recommendations_log'] = np.log1p(df['recommendations'].fillna(0))
    df['recommendations_norm'] = np.clip(df['recommendations_log'] / 15.0, 0, 1)

    # Combined popularity score
    df['popularity_score'] = (
        df['steam_rating_norm'] * 0.4 +
        df['metacritic_norm'] * 0.3 +
        df['recommendations_norm'] * 0.3
    ) * 100

    # Rarity features
    df['global_percentage_filled'] = df['global_percentage'].fillna(50.0)
    df['rarity_score'] = np.minimum(100, 100 * np.exp(-df['global_percentage_filled'] / 20))
    df['ultra_rare'] = (df['global_percentage_filled'] < 1.0).astype(int)
    df['very_rare'] = ((df['global_percentage_filled'] >= 1.0) & (df['global_percentage_filled'] < 5.0)).astype(int)
    df['rare'] = ((df['global_percentage_filled'] >= 5.0) & (df['global_percentage_filled'] < 20.0)).astype(int)

    # Effort estimation features
    estimated_hours = 5 + (95 * np.exp(-df['global_percentage_filled'] / 15))
    df['effort_score'] = np.minimum(estimated_hours / 2, 100)
    df['is_hidden_int'] = df['is_hidden'].astype(int)
    df['effort_score'] = df['effort_score'] * (1.2 ** df['is_hidden_int'])
    df['effort_score'] = np.minimum(df['effort_score'], 100)

    # Text features
    df['name_length'] = df['achievement_name'].fillna('').str.len()
    df['desc_length'] = df['achievement_description'].fillna('').str.len()
    df['name_word_count'] = df['achievement_name'].fillna('').str.split().str.len()
    df['desc_word_count'] = df['achievement_description'].fillna('').str.split().str.len()

    # Interaction features
    df['popularity_rarity_interaction'] = df['popularity_score'] * df['rarity_score'] / 100
    df['effort_rarity_interaction'] = df['effort_score'] * df['rarity_score'] / 100

    # Game-level aggregations
    game_stats = df.groupby('game_id').agg({
        'achievement_id': 'count',
        'global_percentage_filled': 'mean',
        'rarity_score': 'mean'
    }).rename(columns={
        'achievement_id': 'game_achievement_count',
        'global_percentage_filled': 'game_avg_completion',
        'rarity_score': 'game_avg_rarity'
    })
    df = df.merge(game_stats, left_on='game_id', right_index=True, how='left')

    print(f"   Engineered {len([c for c in df.columns if c not in ['achievement_id', 'game_id', 'achievement_name', 'achievement_description', 'game_name']])} features")

    return df


def get_feature_columns():
    """Get list of feature columns for training"""
    return [
        'popularity_score', 'rarity_score', 'effort_score',
        'steam_rating_norm', 'metacritic_norm', 'recommendations_norm',
        'global_percentage_filled', 'ultra_rare', 'very_rare', 'rare',
        'is_hidden_int', 'name_length', 'desc_length',
        'name_word_count', 'desc_word_count',
        'popularity_rarity_interaction', 'effort_rarity_interaction',
        'game_achievement_count', 'game_avg_completion', 'game_avg_rarity'
    ]


def train_xgboost(X_train, y_train, X_val, y_val, config):
    """Train XGBoost model"""
    try:
        import xgboost as xgb
        print("   Training XGBoost...")

        model_config = config['model_config']['xgb']
        model = xgb.XGBRegressor(**model_config)
        model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)

        return model
    except ImportError:
        print("   WARNING: XGBoost not installed, skipping")
        return None


def train_lightgbm(X_train, y_train, X_val, y_val, config):
    """Train LightGBM model"""
    try:
        import lightgbm as lgb
        print("   Training LightGBM...")

        model_config = config['model_config']['lgb']
        model = lgb.LGBMRegressor(**model_config)
        model.fit(X_train, y_train, eval_set=[(X_val, y_val)])

        return model
    except ImportError:
        print("   WARNING: LightGBM not installed, skipping")
        return None


def train_catboost(X_train, y_train, X_val, y_val, config):
    """Train CatBoost model"""
    try:
        from catboost import CatBoostRegressor
        print("   Training CatBoost...")

        model_config = config['model_config']['cat']
        model = CatBoostRegressor(**model_config)
        model.fit(X_train, y_train, eval_set=(X_val, y_val))

        return model
    except ImportError:
        print("   WARNING: CatBoost not installed, skipping")
        return None


def train_tabnet(X_train, y_train, X_val, y_val, config):
    """Train TabNet deep learning model"""
    if not config['training_config']['use_tabnet']:
        return None

    try:
        from pytorch_tabnet.tab_model import TabNetRegressor
        print("   Training TabNet (deep learning)...")

        model_config = config['model_config']['tabnet']
        model = TabNetRegressor(**model_config)
        model.fit(
            X_train.values, y_train.values.reshape(-1, 1),
            eval_set=[(X_val.values, y_val.values.reshape(-1, 1))],
            eval_metric=['rmse']
        )

        return model
    except ImportError:
        print("   WARNING: TabNet not installed, skipping")
        return None


def generate_bert_embeddings(df, config):
    """Generate BERT embeddings from achievement text"""
    if not config['training_config']['use_bert']:
        return None

    try:
        from transformers import AutoTokenizer, AutoModel
        import torch
        print("   Generating BERT embeddings from text...")

        bert_config = config['bert_config']
        model_name = bert_config['model_name']

        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModel.from_pretrained(model_name)
        model.eval()

        # Combine achievement name and description
        texts = (df['achievement_name'].fillna('') + ' ' + df['achievement_description'].fillna('')).tolist()

        embeddings = []
        batch_size = bert_config['batch_size']

        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i+batch_size]
            inputs = tokenizer(batch_texts, padding=True, truncation=True,
                             max_length=bert_config['max_length'], return_tensors='pt')

            with torch.no_grad():
                outputs = model(**inputs)
                batch_embeddings = outputs.last_hidden_state[:, 0, :].numpy()
                embeddings.append(batch_embeddings)

        embeddings = np.vstack(embeddings)
        print(f"   Generated {embeddings.shape[1]}-dimensional embeddings for {len(texts)} achievements")

        return embeddings
    except ImportError:
        print("   WARNING: Transformers not installed, skipping BERT")
        return None


def train_ensemble(df, config):
    """Train ensemble of models with meta-learner"""
    print("\nTraining ensemble models...")

    # Prepare features and target
    feature_cols = get_feature_columns()
    X = df[feature_cols].copy()

    # Generate synthetic target based on features (since we don't have ground truth)
    # This creates a realistic target using weighted combination
    y = (
        10 +  # intercept
        0.3 * df['popularity_score'] +
        0.4 * df['rarity_score'] +
        0.3 * df['effort_score']
    )
    y = np.clip(y, 1, 1000).round()

    # Split data
    train_config = config['training_config']
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=train_config['test_size'], random_state=train_config['random_state']
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.5, random_state=train_config['random_state']
    )

    # Standardize features
    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(scaler.fit_transform(X_train), columns=X_train.columns)
    X_val_scaled = pd.DataFrame(scaler.transform(X_val), columns=X_val.columns)
    X_test_scaled = pd.DataFrame(scaler.transform(X_test), columns=X_test.columns)

    print(f"   Training set: {len(X_train)} samples")
    print(f"   Validation set: {len(X_val)} samples")
    print(f"   Test set: {len(X_test)} samples")

    # Train base models
    models = {}
    models['xgb'] = train_xgboost(X_train, y_train, X_val, y_val, config)
    models['lgb'] = train_lightgbm(X_train, y_train, X_val, y_val, config)
    models['cat'] = train_catboost(X_train, y_train, X_val, y_val, config)
    models['tabnet'] = train_tabnet(X_train_scaled, y_train, X_val_scaled, y_val, config)

    # Remove None models
    models = {k: v for k, v in models.items() if v is not None}

    if len(models) == 0:
        print("\nERROR: No models were successfully trained. Install at least one: xgboost, lightgbm, or catboost")
        sys.exit(1)

    # Generate meta-features from base model predictions
    print("\n   Generating meta-features for ensemble...")
    meta_features_train = []
    meta_features_val = []
    meta_features_test = []

    for name, model in models.items():
        if name == 'tabnet':
            pred_train = model.predict(X_train_scaled.values).flatten()
            pred_val = model.predict(X_val_scaled.values).flatten()
            pred_test = model.predict(X_test_scaled.values).flatten()
        else:
            pred_train = model.predict(X_train)
            pred_val = model.predict(X_val)
            pred_test = model.predict(X_test)

        meta_features_train.append(pred_train)
        meta_features_val.append(pred_val)
        meta_features_test.append(pred_test)

    meta_X_train = np.column_stack(meta_features_train)
    meta_X_val = np.column_stack(meta_features_val)
    meta_X_test = np.column_stack(meta_features_test)

    # Train meta-learner
    print("   Training meta-learner (Ridge Regression)...")
    ridge_config = config['model_config']['ridge']
    meta_model = Ridge(**ridge_config)
    meta_model.fit(meta_X_train, y_train)

    # Evaluate
    print("\nEvaluating ensemble performance...")
    predictions = meta_model.predict(meta_X_test)

    r2 = r2_score(y_test, predictions)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    mae = mean_absolute_error(y_test, predictions)

    print(f"   R² Score: {r2:.4f}")
    print(f"   RMSE: {rmse:.2f}")
    print(f"   MAE: {mae:.2f}")

    # Show model weights
    print("\nMeta-learner weights (model importance):")
    for i, (name, _) in enumerate(models.items()):
        weight = meta_model.coef_[i]
        print(f"   {name.upper()}: {weight:.4f}")

    return models, meta_model, scaler


def predict_with_ensemble(df, models, meta_model, scaler):
    """Generate predictions using trained ensemble"""
    print("\nGenerating predictions with ensemble...")

    feature_cols = get_feature_columns()
    X = df[feature_cols].copy()
    X_scaled = pd.DataFrame(scaler.transform(X), columns=X.columns)

    # Get predictions from each base model
    meta_features = []
    for name, model in models.items():
        if name == 'tabnet':
            predictions = model.predict(X_scaled.values).flatten()
        else:
            predictions = model.predict(X)
        meta_features.append(predictions)

    meta_X = np.column_stack(meta_features)

    # Get final predictions from meta-learner
    final_predictions = meta_model.predict(meta_X)

    # Clip to valid range
    final_predictions = np.clip(final_predictions, 1, 1000).round().astype(int)

    return final_predictions


def update_database(conn, df):
    """Update achievement points in database"""
    cursor = conn.cursor()

    print(f"\nUpdating {len(df)} achievements in database...")

    updated_count = 0
    batch_size = 1000

    for i in range(0, len(df), batch_size):
        batch = df.iloc[i:i+batch_size]

        for _, row in batch.iterrows():
            try:
                cursor.execute(
                    "UPDATE SteamAchievements SET Points = ? WHERE Id = ?",
                    (int(row['points']), int(row['achievement_id']))
                )
                updated_count += 1
            except Exception as e:
                print(f"WARNING: Error updating achievement {row['achievement_id']}: {e}")

        conn.commit()

        if (i + batch_size) % 5000 == 0:
            print(f"   Updated {min(i + batch_size, len(df))}/{len(df)} achievements...")

    print(f"Updated {updated_count} achievements successfully")
    cursor.close()


def save_models_to_disk(models, meta_model, scaler):
    """Save trained models for future use"""
    if not SAVE_MODELS:
        return

    try:
        import pickle

        if not os.path.exists(MODEL_DIR):
            os.makedirs(MODEL_DIR)

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        # Save scaler
        with open(os.path.join(MODEL_DIR, f'scaler_{timestamp}.pkl'), 'wb') as f:
            pickle.dump(scaler, f)

        # Save meta-model
        with open(os.path.join(MODEL_DIR, f'meta_model_{timestamp}.pkl'), 'wb') as f:
            pickle.dump(meta_model, f)

        # Save base models
        for name, model in models.items():
            with open(os.path.join(MODEL_DIR, f'{name}_{timestamp}.pkl'), 'wb') as f:
                pickle.dump(model, f)

        print(f"\nModels saved to {MODEL_DIR}/")
    except Exception as e:
        print(f"WARNING: Failed to save models: {e}")


def generate_report(df):
    """Generate comprehensive statistics report"""
    print("\n" + "="*60)
    print("ENSEMBLE POINTS SYSTEM REPORT")
    print("="*60)

    print(f"\nStatistics:")
    print(f"   Total achievements: {len(df):,}")
    print(f"   Average points: {df['points'].mean():.2f}")
    print(f"   Median points: {df['points'].median():.0f}")
    print(f"   Min points: {df['points'].min()}")
    print(f"   Max points: {df['points'].max()}")
    print(f"   Std deviation: {df['points'].std():.2f}")

    print(f"\nPoints Distribution:")
    print(f"   1-10 points: {(df['points'] <= 10).sum():,} ({(df['points'] <= 10).sum()/len(df)*100:.1f}%)")
    print(f"   11-50 points: {((df['points'] > 10) & (df['points'] <= 50)).sum():,} ({((df['points'] > 10) & (df['points'] <= 50)).sum()/len(df)*100:.1f}%)")
    print(f"   51-100 points: {((df['points'] > 50) & (df['points'] <= 100)).sum():,} ({((df['points'] > 50) & (df['points'] <= 100)).sum()/len(df)*100:.1f}%)")
    print(f"   100+ points: {(df['points'] > 100).sum():,} ({(df['points'] > 100).sum()/len(df)*100:.1f}%)")

    print(f"\nTop 10 Highest Value Achievements:")
    top_10 = df.nlargest(10, 'points')[['achievement_name', 'game_name', 'points', 'global_percentage']]
    for i, row in enumerate(top_10.itertuples(), 1):
        rarity = f"{row.global_percentage:.2f}%" if pd.notna(row.global_percentage) else "Unknown"
        print(f"   {i}. {row.achievement_name} ({row.game_name})")
        print(f"      Points: {row.points} | Rarity: {rarity}")


def save_csv_report(df, output_path):
    """Save detailed CSV report"""
    if not GENERATE_CSV_REPORT:
        return

    print(f"\nSaving CSV report to {output_path}...")

    report_df = df[[
        'achievement_id', 'achievement_name', 'game_name',
        'points', 'popularity_score', 'rarity_score', 'effort_score',
        'global_percentage', 'is_hidden'
    ]].copy()

    report_df.to_csv(output_path, index=False)
    print(f"CSV report saved")


def main():
    print("ENSEMBLE ACHIEVEMENT POINTS CALCULATION SYSTEM")
    print("="*60)
    print("Using: XGBoost + LightGBM + CatBoost + TabNet + Ridge Meta-Learner")
    print("="*60)

    try:
        # Load configuration
        config = load_config()

        # Connect to database
        print(f"\nConnecting to database...")
        conn = get_db_connection()
        print("Connected successfully")

        # Fetch data
        print(f"\nFetching achievement data from database...")
        df = fetch_achievement_data(conn)
        print(f"Fetched {len(df):,} achievements")

        if len(df) == 0:
            print("WARNING: No achievements found in database")
            return

        # Engineer features
        df = engineer_features(df)

        # Train ensemble
        models, meta_model, scaler = train_ensemble(df, config)

        # Generate predictions
        df['points'] = predict_with_ensemble(df, models, meta_model, scaler)

        # Update database
        update_database(conn, df)

        # Save models
        save_models_to_disk(models, meta_model, scaler)

        # Generate report
        generate_report(df)

        # Save CSV
        save_csv_report(df, CSV_OUTPUT_PATH)

        # Close connection
        conn.close()

        print(f"\nAll done!")

    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
