#!/usr/bin/env python3
"""
Quick test script for ensemble points system
Verifies all ML libraries are installed and models can be loaded
"""

import sys

def test_imports():
    """Test all required imports"""
    print("Testing imports...")

    required = {
        'pandas': 'pandas',
        'numpy': 'numpy',
        'scikit-learn': 'sklearn',
        'xgboost': 'xgboost',
        'lightgbm': 'lightgbm',
        'catboost': 'catboost',
    }

    optional = {
        'pytorch-tabnet': 'pytorch_tabnet',
        'transformers': 'transformers',
        'torch': 'torch',
    }

    all_good = True

    print("\nRequired libraries:")
    for name, module in required.items():
        try:
            __import__(module)
            print(f"   OK: {name}")
        except ImportError:
            print(f"   MISSING: {name}")
            all_good = False

    print("\nOptional libraries (for maximum accuracy):")
    for name, module in optional.items():
        try:
            __import__(module)
            print(f"   OK: {name}")
        except ImportError:
            print(f"   NOT INSTALLED: {name} (optional)")

    return all_good


def test_config():
    """Test configuration file"""
    print("\n\nTesting configuration...")

    try:
        import json
        import os

        config_path = os.path.join(os.path.dirname(__file__), 'ensemble-config.json')
        with open(config_path, 'r') as f:
            config = json.load(f)

        print("   OK: Configuration file loaded")
        print(f"   Models configured: {', '.join(config['model_config'].keys())}")
        print(f"   BERT enabled: {config['training_config']['use_bert']}")
        print(f"   TabNet enabled: {config['training_config']['use_tabnet']}")

        return True
    except Exception as e:
        print(f"   ERROR: {e}")
        return False


def test_database_connection():
    """Test database connection"""
    print("\n\nTesting database connection...")

    try:
        import pyodbc
        from dotenv import load_dotenv
        import os

        load_dotenv()

        # Try to get connection string
        key_vault_uri = os.getenv('KEY_VAULT_URI') or os.getenv('AZURE_KEY_VAULT_URI')

        if key_vault_uri:
            print(f"   Azure Key Vault configured: {key_vault_uri}")
        else:
            print("   Using .env file for credentials")

        db_host = os.getenv('DB_HOST', 'localhost')
        db_name = os.getenv('DB_NAME', 'steam-games-achievements')

        print(f"   Target database: {db_name} on {db_host}")
        print("   Note: Not connecting (use ensemble-points-system.py for full test)")

        return True
    except Exception as e:
        print(f"   ERROR: {e}")
        return False


def test_model_creation():
    """Test that models can be instantiated"""
    print("\n\nTesting model creation...")

    try:
        import xgboost as xgb
        import lightgbm as lgb
        from catboost import CatBoostRegressor
        from sklearn.linear_model import Ridge
        import numpy as np

        # Create dummy data
        X = np.random.rand(100, 10)
        y = np.random.rand(100)

        # Test XGBoost
        xgb_model = xgb.XGBRegressor(n_estimators=10, max_depth=3, random_state=42, verbose=0)
        xgb_model.fit(X, y)
        print("   OK: XGBoost model created and trained")

        # Test LightGBM
        lgb_model = lgb.LGBMRegressor(n_estimators=10, max_depth=3, random_state=42, verbose=-1)
        lgb_model.fit(X, y)
        print("   OK: LightGBM model created and trained")

        # Test CatBoost
        cat_model = CatBoostRegressor(iterations=10, depth=3, random_seed=42, verbose=False)
        cat_model.fit(X, y)
        print("   OK: CatBoost model created and trained")

        # Test Ridge
        ridge_model = Ridge(alpha=1.0, random_state=42)
        ridge_model.fit(X, y)
        print("   OK: Ridge meta-learner created and trained")

        return True
    except Exception as e:
        print(f"   ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    print("="*60)
    print("ENSEMBLE POINTS SYSTEM - VERIFICATION TEST")
    print("="*60)

    results = []

    results.append(("Imports", test_imports()))
    results.append(("Configuration", test_config()))
    results.append(("Database Setup", test_database_connection()))
    results.append(("Model Creation", test_model_creation()))

    print("\n\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)

    for name, passed in results:
        status = "PASS" if passed else "FAIL"
        print(f"{name}: {status}")

    all_passed = all(result[1] for result in results)

    if all_passed:
        print("\nAll tests passed! Ready to run ensemble-points-system.py")
        return 0
    else:
        print("\nSome tests failed. Install missing dependencies:")
        print("  pip install -r requirements-ensemble.txt")
        return 1


if __name__ == "__main__":
    sys.exit(main())
