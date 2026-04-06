# Points System - Database Integration

## Overview

The points system works **entirely with your SQL Server database**. No CSV files needed!

**Flow:**
```
Database → Python Script (calculate) → Database → TypeScript Service (use)
```

## Quick Start

### 1. Calculate Points (Python)

```bash
cd scripts/src/utils/PointSystem

# Install dependencies (one time)
pip install pyodbc pandas numpy python-dotenv

# Run points calculator
python update-points-from-db.py
```

**Basic System (update-points-from-db.py):**
- Reads achievements + game data from database
- Calculates points using weighted scoring algorithm
- Updates `SteamAchievements.Points` column in database
- Fast, lightweight, good for regular updates
- **No CSV files needed** (report is optional, disabled by default)

**Ensemble ML System (ensemble-points-system.py):**
```bash
pip install -r requirements-ensemble.txt
python ensemble-points-system.py
```
- Uses XGBoost, LightGBM, CatBoost, TabNet, and Ridge meta-learner
- Very high accuracy with multiple ML models
- Automatically learns optimal feature weights
- Slower but more accurate than basic system
- Best for initial setup or major recalculations

### 2. Use Points (TypeScript)

```typescript
import { getConnection } from './database/connection';
import { PointsService } from './services/pointsService';

const pool = await getConnection();
const pointsService = new PointsService(pool);

// Get user points
const summary = await pointsService.getUserPointsSummary(userId);
console.log(`${summary.username}: ${summary.totalPoints} points`);

// Get leaderboard
const leaderboard = await pointsService.getLeaderboard(100);
```

## Configuration

### Azure Key Vault (Recommended)

The Python script uses Azure Key Vault for secure credential storage, with fallback to `.env`:

**Priority 1: Azure Key Vault**
```bash
# Set in .env or environment
KEY_VAULT_URI=https://your-keyvault.vault.azure.net/

# The script will load: ConnectionStrings--DefaultConnection
# Uses DefaultAzureCredential (same as TypeScript)
```

**Priority 2: Environment Variables (Fallback)**
```bash
# In .env file
DB_HOST=localhost
DB_NAME=steam-games-achievements
DB_USER=ACT
DB_PASSWORD=ACT

# Or provide full connection string
DB_CONNECTION_STRING=DRIVER={ODBC Driver 17 for SQL Server};SERVER=localhost;DATABASE=steam-games-achievements;UID=ACT;PWD=ACT

# Optional: Enable CSV report (not needed for integration)
GENERATE_CSV_REPORT=false  # Set to 'true' to generate CSV
CSV_OUTPUT_PATH=ensemble-points-report.csv
```

### Dependencies

**Basic System:**
```bash
pip install -r requirements-basic.txt
```

**Ensemble ML System (High Accuracy):**
```bash
pip install -r requirements-ensemble.txt
```

## Points Calculation Formula

```python
points = intercept + (popularity_weight * popularity_score) +
                    (rarity_weight * rarity_score) +
                    (effort_weight * effort_score)
```

### Default Weights
- **Popularity**: 0.3 (based on Steam rating, Metacritic, recommendations)
- **Rarity**: 0.4 (based on global completion percentage)
- **Effort**: 0.3 (estimated time/difficulty, +20% for hidden)
- **Intercept**: 10
- **Range**: 1-1000 points

## Testing

```bash
# Test the TypeScript service
npx ts-node src/testPoints.ts leaderboard 10
npx ts-node src/testPoints.ts user <userId>
npx ts-node src/testPoints.ts breakdown <userId>
```

## Database Requirements

### Required Columns
- `SteamAchievements.Points` (INT) - Calculated point value
- `SteamAchievements.IsHidden` (BIT) - Hidden flag
- `SteamAchievementStats.GlobalPercentage` (DECIMAL) - Completion %
- `SteamGames.SteamRating` (INT) - User rating 0-100
- `SteamGames.MetacriticScore` (INT) - Critic score 0-100
- `SteamGames.Recommendations` (INT) - Positive recommendations count

### Schema
```sql
-- Points are stored directly in the achievements table
ALTER TABLE SteamAchievements ADD Points INT NULL;

-- Stats table has global completion percentage
CREATE TABLE SteamAchievementStats (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AchievementId INT NOT NULL,
    GlobalPercentage DECIMAL(5,2),
    FOREIGN KEY (AchievementId) REFERENCES SteamAchievements(Id)
);
```

## When to Recalculate

Run the Python script when:
- New achievements added to database
- Global completion percentages change significantly
- You want to adjust the weights/formula
- Weekly/monthly scheduled update

## CSV Reports (Optional)

CSV reports are **optional** and not used by the integration:

```bash
# Enable CSV generation
export GENERATE_CSV_REPORT=true
python update-points-from-db.py
```

This creates `ensemble-points-report.csv` for human review only.

**Note:** CSV files are in `.gitignore` - they're too large for Git.

## Advanced ML Options

For more sophisticated point calculations:

### Option 1: Ensemble Learning (Advanced)
```bash
pip install -r requirements-ensemble.txt
# Uses XGBoost, LightGBM, CatBoost, BERT, TabNet
# See ensemble-points-system.ipynb
```

### Option 2: Custom Weights
Edit `update-points-from-db.py` to adjust weights:

```python
weights = {
    'popularity': 0.35,  # Increase if popular games matter more
    'rarity': 0.45,      # Increase if rarity matters more
    'effort': 0.20,      # Decrease if time matters less
    'intercept': 15      # Minimum points baseline
}
df = calculate_points(df, weights)
```

## Troubleshooting

### "No achievements found"
- Ensure `SteamAchievementStats` table has global percentage data
- Ensure `SteamGames` table has popularity metrics

### "Connection failed"
- Check `.env` database credentials
- Ensure SQL Server ODBC driver installed
- Verify SQL Server is running

### Points seem too high/low
- Adjust weights in the Python script
- Check data quality (null values, outliers)
- Verify rarity percentages are reasonable (0-100)

## Performance

- **Calculation**: ~1-2 minutes for 50K achievements
- **Database Update**: ~30-60 seconds for 50K achievements
- **TypeScript Queries**: <100ms for most operations
- **Memory**: ~500MB for large datasets

## Files Overview

- `update-points-from-db.py` - **Main script** (database only)
- `ensemble-points-system.ipynb` - Advanced ML version (optional)
- `requirements-points.txt` - Basic dependencies
- `requirements-ensemble.txt` - ML dependencies (optional)
- `ensemble-config.json` - ML hyperparameters (optional)
- `*.csv` - Reports only (not needed, ignored by git)
