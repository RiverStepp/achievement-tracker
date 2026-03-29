# Achievement Points System

## Overview

This points system calculates achievement values based on multiple factors to create a fair and meaningful scoring system. The system uses regression analysis to determine optimal weights for different factors.

## Scoring Factors

### 1. Game Popularity Score
Combines multiple metrics to measure how popular/well-regarded a game is:
- **Steam Rating** (40% weight): User rating from Steam
- **Metacritic Score** (30% weight): Professional review scores
- **Recommendations** (30% weight): Number of positive recommendations (log-scaled)

**Formula:**
```
popularity_score = (steam_rating * 0.4) + (metacritic_score * 0.3) + (log(recommendations) * 0.3)
```

### 2. Achievement Rarity Score
Measures how rare an achievement is based on global completion percentage:
- **Ultra Rare** (<1%): Highest score (100)
- **Very Rare** (1-5%): Very high score
- **Rare** (5-20%): High score
- **Common** (20-50%): Medium score
- **Very Common** (>50%): Lower score

**Formula:**
```
rarity_score = 100 * exp(-global_percentage / 20)
```

### 3. Effort/Time Required Score
Estimates the time and effort needed to unlock an achievement:
- Based on rarity (rarer achievements typically require more time)
- Hidden achievements get a 20% bonus
- Estimated time ranges from 5-100 hours

**Formula:**
```
effort_score = min(estimated_time_hours / 2, 100) * (1.2 if hidden else 1.0)
```

## Points Calculation

The final points are calculated using a weighted formula:

```
points = intercept + (w1 * popularity_score) + (w2 * rarity_score) + (w3 * effort_score)
```

Where weights are determined by regression analysis to optimize the scoring system.

**Default Weights** (can be optimized via regression):
- Popularity: 0.3
- Rarity: 0.4
- Effort: 0.3
- Intercept: 10

Points are capped between 1 and 1000.

## Usage

### Option 1: Python Script (Recommended - Uses Regression)

The Python script uses machine learning to determine optimal weights:

```bash
# Install dependencies
pip install pyodbc pandas numpy scikit-learn python-dotenv

# Run the script
python scripts/calculate-achievement-points.py
```

This script will:
1. Fetch achievement data from the database
2. Train a regression model to find optimal weights
3. Calculate points for all achievements
4. Update the database
5. Generate a detailed report

### Option 2: JavaScript Script (Quick Update)

For a quick update using default weights:

```bash
node scripts/update-achievement-points.js
```

## Database Requirements

The system requires the following database structure:

### Games Table
- `steam_rating` (INT): Steam user rating (0-100)
- `metacritic_score` (INT): Metacritic score (0-100)
- `recommendations` (INT): Number of positive recommendations

### Achievements Table
- `points` (INT): Calculated points value
- `is_hidden` (BIT): Whether achievement is hidden

### Achievement Stats Table
- `global_percentage` (DECIMAL): Percentage of players who unlocked it

## Regression Analysis

The Python script uses linear regression to find optimal weights. The model:
- Uses standardized features
- Splits data into train/test sets (80/20)
- Evaluates using R² and MSE
- Reports feature importance

After running regression, you can update the JavaScript script with the optimized weights.

## Example Output

```
ACHIEVEMENT POINTS CALCULATION SYSTEM
============================================================

Fetched 15,234 achievements with complete data
Preparing features...
Training regression model...
Model trained - R²: 0.8472, MSE: 234.56

Feature Weights (from regression):
   Popularity: 0.3245 (importance: 32.45%)
   Rarity: 0.4123 (importance: 41.23%)
   Effort: 0.2632 (importance: 26.32%)
   Intercept: 12.34

Calculating points for all achievements...
Updating points in database...
Updated 15,234 achievements

POINTS SYSTEM REPORT
============================================================
Statistics:
   Total achievements: 15,234
   Average points: 45.67
   Median points: 38
   Min points: 1
   Max points: 987
```

## Customization

### Adjusting Weights

After running regression, update the weights in `update-achievement-points.js`:

```javascript
const defaultWeights = {
    popularity: 0.3245,  // From regression
    rarity: 0.4123,      // From regression
    effort: 0.2632,      // From regression
    intercept: 12.34     // From regression
};
```

### Adjusting Time Estimates

Modify the `estimateTimeRequired` function to better reflect actual time requirements:

```javascript
function estimateTimeRequired(globalPercentage) {
    // Your custom logic here
    if (globalPercentage < 1) return 150;
    // ...
}
```

### Adjusting Popularity Weights

Modify the `normalizePopularityScore` function to change how popularity is calculated:

```javascript
// Example: Give more weight to Metacritic
return steamNorm * 0.3 + metacriticNorm * 0.5 + recNorm * 0.2;
```

## Future Enhancements

Potential improvements:
1. **Collect actual time data**: Track how long users take to unlock achievements
2. **Difficulty ratings**: Add explicit difficulty ratings from users
3. **Game genre weighting**: Different genres might have different scoring scales
4. **Temporal factors**: Account for achievements that become easier/harder over time
5. **Community feedback**: Incorporate user ratings of achievement difficulty

## Troubleshooting

### No achievements found
- Ensure `achievement_stats` table has `global_percentage` data
- Ensure `games` table has popularity metrics populated

### Low R² score in regression
- May need more data
- Consider adding more features
- Check for data quality issues

### Points seem too high/low
- Adjust the intercept value
- Scale the weights proportionally
- Check if normalization is working correctly



