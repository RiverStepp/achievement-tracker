# Points System Integration

This document explains how to use the TypeScript Points Service with the Python/ML-based point calculation system.

## Overview

The points system has two parts:
1. **Python/ML Scripts** (in `utils/PointSystem/`) - Calculate point values using machine learning
2. **TypeScript Service** (`pointsService.ts`) - Read and work with points in your application

## Workflow

### 1. Calculate Points (Python - Run Periodically)

First, use the Python scripts to calculate and store points in the database:

```bash
# Option A: Simple regression-based system
cd scripts/src/utils/PointSystem
pip install -r requirements-points.txt
python calculate-achievement-points.py

# Option B: Advanced ensemble learning system (recommended)
pip install -r requirements-ensemble.txt
python ensemble-points-system.py
```

This will:
- Fetch achievement and game data from database
- Calculate points using ML models
- Update the `Points` column in `SteamAchievements` table
- Generate a detailed report

### 2. Use Points in TypeScript

Once points are calculated and stored, use the `PointsService` to work with them:

```typescript
import { getConnection } from './database/connection';
import { PointsService } from './services/pointsService';

// Initialize
const pool = await getConnection();
const pointsService = new PointsService(pool);

// Get user's total points
const totalPoints = await pointsService.getUserTotalPoints(userId);

// Get detailed summary with top achievements
const summary = await pointsService.getUserPointsSummary(userId, 10);
console.log(`${summary.username} has ${summary.totalPoints} points`);

// Get points breakdown by game
const breakdown = await pointsService.getUserGamePointsBreakdown(userId);
breakdown.forEach(game => {
  console.log(`${game.gameName}: ${game.unlockedPoints}/${game.totalPoints} points`);
});

// Get leaderboard
const leaderboard = await pointsService.getLeaderboard(100);
leaderboard.forEach(entry => {
  console.log(`${entry.rank}. ${entry.username}: ${entry.totalPoints} pts`);
});

// Get rarest achievements for a game
const rarest = await pointsService.getGameRarestAchievements(gameId, 10);
```

## Testing

Use the test script to try out the points service:

```bash
# Show user points summary
npx ts-node src/testPoints.ts user <userId>

# Show leaderboard (top 10)
npx ts-node src/testPoints.ts leaderboard 10

# Show rarest achievements for a game
npx ts-node src/testPoints.ts game <gameId> 10

# Show user's points breakdown by game
npx ts-node src/testPoints.ts breakdown <userId>
```

## API Integration

The `PointsService` is designed to be used in your API endpoints:

```typescript
// Example API endpoint
app.get('/api/users/:userId/points', async (req, res) => {
  const userId = parseInt(req.params.userId);
  const pointsService = new PointsService(pool);

  const summary = await pointsService.getUserPointsSummary(userId);
  res.json(summary);
});

app.get('/api/leaderboard', async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const offset = parseInt(req.query.offset as string) || 0;

  const pointsService = new PointsService(pool);
  const leaderboard = await pointsService.getLeaderboard(limit, offset);

  res.json(leaderboard);
});
```

## Methods Reference

### `getUserTotalPoints(userId: number): Promise<number>`
Get the sum of all points for a user's unlocked achievements.

### `getUserPointsSummary(userId: number, topN?: number): Promise<UserPointsSummary>`
Get detailed points summary including:
- Total points
- Achievement count
- Average points per achievement
- Top N highest-value achievements

### `getUserGamePointsBreakdown(userId: number): Promise<GamePointsBreakdown[]>`
Get points breakdown for each game the user owns:
- Total possible points
- Unlocked points
- Completion percentage

### `getLeaderboard(limit?: number, offset?: number): Promise<LeaderboardEntry[]>`
Get top users ranked by total points.

### `getAchievementPoints(achievementId: number): Promise<number>`
Get point value for a specific achievement.

### `getGameRarestAchievements(gameId: number, limit?: number): Promise<AchievementPoints[]>`
Get the highest-point (rarest) achievements for a game.

## Database Requirements

The points system requires these tables/columns:

- `SteamAchievements.Points` (INT) - Point value for each achievement
- `SteamAchievementStats.GlobalPercentage` (DECIMAL) - Global completion %
- `SteamGames` - Game metadata for calculations
- `SteamUserAchievements` - User unlocked achievements

## Updating Points

Re-run the Python scripts periodically to recalculate points:

```bash
# Weekly or monthly
python ensemble-points-system.py
```

This is useful when:
- New achievements are added
- Global completion percentages change significantly
- You want to refine the ML models with more data

## Performance Notes

- All queries use indexes on userId, achievementId, gameId
- Leaderboard queries use ROW_NUMBER() for pagination
- Consider caching user totals if performance is critical
- The Python ML scripts can take 10-30 minutes on large datasets

## Future Enhancements

Potential improvements:
- Real-time point calculation API endpoint
- Caching layer (Redis) for frequently accessed data
- Historical points tracking (track changes over time)
- Achievement difficulty voting system
- Seasonal/time-limited achievement bonuses
