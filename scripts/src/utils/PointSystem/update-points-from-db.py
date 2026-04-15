#!/usr/bin/env python3
"""
Achievement Points Calculator - Database Integration with Azure Key Vault
Reads from database, calculates points, writes back to database.
CSV report is optional.
"""

import os
import sys
import pyodbc
import pandas as pd
import numpy as np
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration
GENERATE_CSV_REPORT = os.getenv('GENERATE_CSV_REPORT', 'false').lower() == 'true'
CSV_OUTPUT_PATH = os.getenv('CSV_OUTPUT_PATH', 'ensemble-points-report.csv')


def load_from_azure_key_vault():
    """
    Load database credentials from Azure Key Vault
    Returns connection string or None if Key Vault not configured
    """
    key_vault_uri = os.getenv('KEY_VAULT_URI') or os.getenv('AZURE_KEY_VAULT_URI')

    if not key_vault_uri:
        return None

    try:
        from azure.identity import DefaultAzureCredential
        from azure.keyvault.secrets import SecretClient

        print(f"Loading credentials from Azure Key Vault: {key_vault_uri}")

        # Initialize Key Vault client with DefaultAzureCredential
        credential = DefaultAzureCredential()
        client = SecretClient(vault_url=key_vault_uri, credential=credential)

        # Load connection string from Key Vault
        # Secret name uses double dashes (--) as separators (matching .NET configuration format)
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
    """
    Get database connection string with priority: Key Vault -> Environment variables
    """
    # First priority: Try Azure Key Vault
    connection_string = load_from_azure_key_vault()

    if connection_string:
        return connection_string

    # Second priority: Environment variables (from .env or system)
    print("Loading database credentials from environment variables (.env)")

    # Check if full connection string is provided
    connection_string = os.getenv('DB_CONNECTION_STRING')
    if connection_string:
        return connection_string

    # Build connection string from individual components
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
    """Create database connection using Azure Key Vault or environment variables"""
    connection_string = get_db_connection_string()
    return pyodbc.connect(connection_string)


def fetch_achievement_data(conn):
    """Fetch all achievements with game data from database"""
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


def calculate_popularity_score(steam_rating, metacritic_score, recommendations):
    """Calculate game popularity score (0-100)"""
    # Normalize values
    steam_norm = (steam_rating or 0) / 100.0
    metacritic_norm = (metacritic_score or 0) / 100.0

    # Log-scale recommendations (handle None/0)
    if recommendations and recommendations > 0:
        rec_log = np.log1p(recommendations)
        rec_norm = min(rec_log / 15.0, 1.0)  # Cap at ~3.2M recommendations
    else:
        rec_norm = 0

    # Weighted combination
    return (steam_norm * 0.4 + metacritic_norm * 0.3 + rec_norm * 0.3) * 100


def calculate_rarity_score(global_percentage):
    """Calculate achievement rarity score (0-100)"""
    if global_percentage is None or pd.isna(global_percentage):
        return 50  # Default for unknown rarity

    # Exponential decay based on rarity
    return min(100, 100 * np.exp(-global_percentage / 20))


def estimate_effort_score(global_percentage, is_hidden):
    """Estimate time/effort required score (0-100)"""
    if global_percentage is None or pd.isna(global_percentage):
        base_effort = 50
    else:
        # Rarer achievements typically take more time
        estimated_hours = 5 + (95 * np.exp(-global_percentage / 15))
        base_effort = min(estimated_hours / 2, 100)

    # Hidden achievements get bonus
    if is_hidden:
        base_effort *= 1.2

    return min(base_effort, 100)


def calculate_points(df, weights=None):
    """
    Calculate points for all achievements

    Args:
        df: DataFrame with achievement data
        weights: Optional dict with keys: popularity, rarity, effort, intercept
    """
    if weights is None:
        # Default weights (can be optimized via regression)
        weights = {
            'popularity': 0.3,
            'rarity': 0.4,
            'effort': 0.3,
            'intercept': 10
        }

    print(f"\nUsing weights:")
    print(f"   Popularity: {weights['popularity']}")
    print(f"   Rarity: {weights['rarity']}")
    print(f"   Effort: {weights['effort']}")
    print(f"   Intercept: {weights['intercept']}")

    # Calculate component scores
    df['popularity_score'] = df.apply(
        lambda row: calculate_popularity_score(
            row['steam_rating'],
            row['metacritic_score'],
            row['recommendations']
        ),
        axis=1
    )

    df['rarity_score'] = df['global_percentage'].apply(calculate_rarity_score)

    df['effort_score'] = df.apply(
        lambda row: estimate_effort_score(
            row['global_percentage'],
            row['is_hidden']
        ),
        axis=1
    )

    # Calculate final points
    df['points'] = (
        weights['intercept'] +
        weights['popularity'] * df['popularity_score'] +
        weights['rarity'] * df['rarity_score'] +
        weights['effort'] * df['effort_score']
    )

    # Cap points between 1 and 1000
    df['points'] = df['points'].clip(1, 1000).round().astype(int)

    return df


def update_database(conn, df):
    """Update points in database"""
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

        # Commit batch
        conn.commit()

        if (i + batch_size) % 5000 == 0:
            print(f"   Updated {min(i + batch_size, len(df))}/{len(df)} achievements...")

    print(f"Updated {updated_count} achievements successfully")

    cursor.close()


def generate_report(df):
    """Generate statistics report"""
    print("\n" + "="*60)
    print("POINTS SYSTEM REPORT")
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

    # Top 10 highest value achievements
    print(f"\nTop 10 Highest Value Achievements:")
    top_10 = df.nlargest(10, 'points')[['achievement_name', 'game_name', 'points', 'global_percentage']]
    for i, row in enumerate(top_10.itertuples(), 1):
        rarity = f"{row.global_percentage:.2f}%" if row.global_percentage else "Unknown"
        print(f"   {i}. {row.achievement_name} ({row.game_name})")
        print(f"      Points: {row.points} | Rarity: {rarity}")


def save_csv_report(df, output_path):
    """Save detailed CSV report (optional)"""
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
    print("ACHIEVEMENT POINTS CALCULATION SYSTEM")
    print("="*60)

    try:
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

        # Calculate points
        print(f"\nCalculating points...")
        df = calculate_points(df)
        print(f"Points calculated for all achievements")

        # Update database
        update_database(conn, df)

        # Generate report
        generate_report(df)

        # Save CSV (optional)
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
