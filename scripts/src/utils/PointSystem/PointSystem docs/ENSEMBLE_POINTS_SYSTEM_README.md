# Dynamic Achievement Points System - Ensemble Learning

A comprehensive machine learning system for calculating dynamic achievement points using ensemble learning with multiple models.

## Overview

This system uses **Ensemble Learning (Multimodal)** to combine various analytical models for accurate point prediction. The ensemble includes:

### 1. Tree-Based Models (Main Predictors)
- **XGBoost**: Finds complex patterns and interactions between game features
- **LightGBM**: Very fast model for large datasets, great with many features
- **CatBoost**: Best with categorical data like tags, genres, platforms

### 2. Deep Learning Models (Text + Complex Features)
- **TabNet**: Learns deeper relationships in mixed data (tabular + deep learning)
- **BERT Embeddings**: Turns game descriptions, tags, and reviews into numeric vectors for predictions

### 3. Linear Meta-Learner (Final Combiner)
- **Ridge Regression**: Combines all model outputs into one final score

## Features Used

The system considers a wide range of features:

### Game Features
- **Price**: Current price, original price, discount percentage, currency
- **Popularity**: Steam rating, Metacritic score, recommendations count
- **Time to Complete**: Main story hours, completionist hours, main+sides hours
- **Metadata**: Developer, publisher, release date, game age
- **Categories**: Genres, tags, categories, platforms
- **Text**: Game description, short description

### Achievement Features
- **Rarity**: Global completion percentage
- **Type**: Hidden vs. visible achievements
- **Text**: Achievement name, description
- **Metadata**: Achievement name/description length

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements-ensemble.txt
```

2. Ensure you have the required database connection configured in your `.env` file:
```
DB_HOST=localhost
DB_NAME=steam-games-achievements
DB_USER=ACT
DB_PASSWORD=ACT
```

## Usage

Run the ensemble learning system:

```bash
python scripts/ensemble-points-system.py
```

The script will:
1. Fetch all achievement and game data from the database
2. Engineer comprehensive features
3. Train all base models (XGBoost, LightGBM, CatBoost, TabNet, BERT)
4. Train the meta-learner (Ridge Regression)
5. Calculate points for all achievements
6. Update the database
7. Generate a detailed report
8. Save trained models for future use

## Model Architecture

```
Input Features
    │
    ├─→ [XGBoost] ─┐
    ├─→ [LightGBM]─┤
    ├─→ [CatBoost]─┤
    ├─→ [TabNet]   ─┤
    └─→ [BERT]     ─┤
                     │
                     ↓
            [Meta-Features]
                     │
                     ↓
            [Ridge Regression]
                     │
                     ↓
            Final Points Score
```

## Output

The system generates:

1. **Database Updates**: All achievement points are updated in the database
2. **Report CSV**: `ensemble-points-report.csv` with detailed breakdown
3. **Saved Models**: All trained models saved in `models/` directory with timestamps
4. **Console Report**: Summary statistics and performance metrics

## Configuration

Edit `ensemble-config.json` to adjust:
- Model hyperparameters
- BERT model selection
- Training parameters
- Feature engineering options

## Performance Metrics

The system reports:
- **R² Score**: Coefficient of determination (higher is better, max 1.0)
- **MAE**: Mean Absolute Error (lower is better)
- **RMSE**: Root Mean Squared Error (lower is better)

## Model Weights

The meta-learner automatically determines optimal weights for each base model. These weights are displayed in the console output, showing which models contribute most to the final prediction.

## Notes

- **BERT**: Uses DistilBERT by default (faster, smaller). Can be changed in config.
- **TabNet**: Requires PyTorch. Falls back gracefully if not available.
- **GPU**: Currently uses CPU. Can be configured for GPU acceleration in config.
- **Memory**: BERT embeddings can be memory-intensive for large datasets. Consider reducing batch size if needed.

## Troubleshooting

### Missing Dependencies
If you see warnings about missing models:
- TabNet: `pip install pytorch-tabnet`
- BERT: `pip install transformers torch`

The system will continue to work without these, but performance may be reduced.

### Database Connection Issues
Ensure your `.env` file has correct database credentials and that the SQL Server ODBC driver is installed.

### Memory Issues
For very large datasets:
- Reduce BERT batch size in config
- Disable TabNet if needed
- Process in batches (modify script)

## Future Enhancements

Potential improvements:
- GPU acceleration for BERT and TabNet
- Online learning for model updates
- Feature importance analysis
- A/B testing framework
- Real-time point recalculation API

