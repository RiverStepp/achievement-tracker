# Achievement Points System

Calculates fair, accurate point values for Steam achievements using machine learning and statistical analysis.

## Quick Start

### 1. Install Dependencies

**Basic System (Recommended for regular updates):**
```bash
pip install -r requirements-basic.txt
```

**Ensemble ML System (Recommended for initial setup):**
```bash
pip install -r requirements-ensemble.txt
```

### 2. Configure Credentials

**Option A: Azure Key Vault (Recommended)**
```bash
# In .env file
KEY_VAULT_URI=https://your-keyvault.vault.azure.net/

# Store connection string in Key Vault as:
# Secret name: ConnectionStrings--DefaultConnection
# Secret value: DRIVER={ODBC Driver 17 for SQL Server};SERVER=...
```

**Option B: Environment Variables (Fallback)**
```bash
# In .env file
DB_HOST=localhost
DB_NAME=steam-games-achievements
DB_USER=ACT
DB_PASSWORD=ACT
```

### 3. Run Points Calculator

**For initial setup or major recalculation (High Accuracy):**
```bash
python ensemble-points-system.py
```
Uses XGBoost, LightGBM, CatBoost, TabNet ensemble for maximum accuracy.
Runtime: 5-15 minutes for large datasets.

**For regular updates (Fast):**
```bash
python update-points-from-db.py
```
Uses weighted formula with proven parameters.
Runtime: 1-2 minutes for large datasets.

### 4. Use Points in TypeScript

```typescript
import { PointsService } from './services/pointsService';

const pointsService = new PointsService(pool);
const summary = await pointsService.getUserPointsSummary(userId);
console.log(`Total Points: ${summary.totalPoints}`);
```

## System Comparison

| Feature | Basic System | Ensemble ML System |
|---------|-------------|-------------------|
| **Accuracy** | Good | Excellent |
| **Speed** | Fast (1-2 min) | Slower (5-15 min) |
| **Dependencies** | Minimal | Extensive |
| **Use Case** | Regular updates | Initial setup, major recalc |
| **Models** | Weighted formula | XGBoost + LightGBM + CatBoost + TabNet |
| **Learning** | Fixed weights | Learns from data |

## Scoring Methodology

Points are calculated based on three factors:

### 1. Popularity Score (0-100)
Measures game quality and popularity:
- Steam user rating (40%)
- Metacritic critic score (30%)
- Recommendation count (30%, log-scaled)

### 2. Rarity Score (0-100)
Based on global completion percentage:
- <1%: Ultra rare (90-100 points)
- 1-5%: Very rare (70-90 points)
- 5-20%: Rare (40-70 points)
- 20-50%: Uncommon (20-40 points)
- >50%: Common (1-20 points)

### 3. Effort Score (0-100)
Estimated time and difficulty:
- Based on completion percentage (rarer = more effort)
- Hidden achievements get 20% bonus
- Estimated from 5 to 100+ hours

### Final Formula

**Basic System:**
```
points = 10 + (0.3 × popularity) + (0.4 × rarity) + (0.3 × effort)
Capped: 1-1000 points
```

**Ensemble System:**
```
points = MetaLearner(
    XGBoost(features),
    LightGBM(features),
    CatBoost(features),
    TabNet(features)
)
Automatically optimized weights
Capped: 1-1000 points
```

## Files

- `update-points-from-db.py` - Basic weighted formula system (fast)
- `ensemble-points-system.py` - ML ensemble system (accurate)
- `requirements-basic.txt` - Minimal dependencies
- `requirements-ensemble.txt` - Full ML dependencies
- `ensemble-config.json` - ML model hyperparameters
- `PointSystem docs/` - Detailed documentation

## Database Schema

Required columns:
```sql
-- Achievements table
ALTER TABLE SteamAchievements ADD Points INT NULL;

-- Stats table (for completion percentage)
CREATE TABLE SteamAchievementStats (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AchievementId INT NOT NULL,
    GlobalPercentage DECIMAL(5,2),
    FOREIGN KEY (AchievementId) REFERENCES SteamAchievements(Id)
);
```

## TypeScript Integration

The `PointsService` provides methods to work with calculated points:

```typescript
// Get user's total points
getUserTotalPoints(userId: number): Promise<number>

// Get detailed summary with top achievements
getUserPointsSummary(userId: number, topN?: number): Promise<UserPointsSummary>

// Get points breakdown by game
getUserGamePointsBreakdown(userId: number): Promise<GamePointsBreakdown[]>

// Get leaderboard
getLeaderboard(limit?: number, offset?: number): Promise<LeaderboardEntry[]>

// Get rarest achievements for a game
getGameRarestAchievements(gameId: number, limit?: number): Promise<AchievementPoints[]>
```

## When to Recalculate

Run the points calculator when:
- Initial system setup
- New achievements added to database
- Global completion percentages change significantly
- Weekly or monthly maintenance
- Adjusting scoring weights/formula

## Performance

**Basic System:**
- 50K achievements: ~1-2 minutes
- Memory: ~200MB
- CPU: Light

**Ensemble System:**
- 50K achievements: ~10-15 minutes
- Memory: ~2GB (with BERT)
- CPU: Intensive (benefits from multi-core)

## Troubleshooting

**No achievements found:**
- Ensure `SteamAchievementStats` table has data
- Check `SteamGames` has popularity metrics

**Connection failed:**
- Verify Azure Key Vault URI and credentials
- Check .env file configuration
- Ensure ODBC Driver 17 for SQL Server is installed

**ML models failing:**
- Install dependencies: `pip install -r requirements-ensemble.txt`
- Ensure sufficient memory (2GB+ recommended)
- Check Python version (3.8+ required)

**Points seem incorrect:**
- Verify data quality (no nulls, valid ranges)
- Check global percentage values (0-100)
- Review weights in configuration
- Compare basic vs ensemble results

## Advanced Configuration

Edit `ensemble-config.json` to adjust:
- Model hyperparameters
- BERT model selection
- Training/validation split
- Feature engineering options

See `PointSystem docs/` for detailed documentation.
