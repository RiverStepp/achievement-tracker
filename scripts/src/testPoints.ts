import * as dotenv from 'dotenv';
import { getConnection } from './database/connection';
import { PointsService } from './services/pointsService';

// Load environment variables
dotenv.config();

async function main() {
  console.log('Achievement Points Service Test\n');

  try {
    // Get database connection
    const pool = await getConnection();
    const pointsService = new PointsService(pool);

    // Parse command line arguments
    const command = process.argv[2];
    const arg1 = process.argv[3];
    const arg2 = process.argv[4];

    switch (command) {
      case 'user':
        // Get user points summary (SteamId as 64-bit integer string)
        if (!arg1) {
          console.error('Usage: ts-node testPoints.ts user <steamId>');
          process.exit(1);
        }
        await showUserPoints(pointsService, arg1);
        break;

      case 'leaderboard':
        // Show leaderboard
        const limit = arg1 ? parseInt(arg1) : 10;
        await showLeaderboard(pointsService, limit);
        break;

      case 'game':
        // Get rarest achievements for a game
        if (!arg1) {
          console.error('Usage: ts-node testPoints.ts game <gameId> [limit]');
          process.exit(1);
        }
        const gameLimit = arg2 ? parseInt(arg2) : 10;
        await showGameRarestAchievements(pointsService, parseInt(arg1), gameLimit);
        break;

      case 'breakdown':
        // Get user game points breakdown
        if (!arg1) {
          console.error('Usage: ts-node testPoints.ts breakdown <steamId>');
          process.exit(1);
        }
        await showUserGameBreakdown(pointsService, arg1);
        break;

      default:
        console.log('Usage:');
        console.log('  ts-node testPoints.ts user <steamId>           - Show user points summary');
        console.log('  ts-node testPoints.ts leaderboard [limit]     - Show points leaderboard');
        console.log('  ts-node testPoints.ts game <gameId> [limit]   - Show rarest achievements for game');
        console.log('  ts-node testPoints.ts breakdown <steamId>     - Show user points breakdown by game');
        process.exit(1);
    }

    await pool.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

async function showUserPoints(pointsService: PointsService, steamIdStr: string) {
  const steamId = BigInt(steamIdStr);
  console.log(`Getting points summary for SteamId ${steamIdStr}...\n`);

  const summary = await pointsService.getUserPointsSummary(steamId);

  console.log('=== User Points Summary ===');
  console.log(`User: ${summary.username} (${summary.steamId})`);
  console.log(`Total Points: ${summary.totalPoints}`);
  console.log(`Achievements Unlocked: ${summary.achievementCount}`);
  console.log(`Average Points/Achievement: ${summary.averagePoints.toFixed(2)}`);

  if (summary.topAchievements.length > 0) {
    console.log(`\nTop ${summary.topAchievements.length} Achievements:`);
    summary.topAchievements.forEach((ach, index) => {
      const rarity = ach.globalPercentage
        ? ` (${ach.globalPercentage.toFixed(2)}% global)`
        : '';
      const hidden = ach.isHidden ? ' [HIDDEN]' : '';
      console.log(`  ${index + 1}. ${ach.achievementName}${hidden}`);
      console.log(`     Game: ${ach.gameName}`);
      console.log(`     Points: ${ach.points}${rarity}`);
    });
  }
}

async function showLeaderboard(pointsService: PointsService, limit: number) {
  console.log(`Getting top ${limit} users by points...\n`);

  const leaderboard = await pointsService.getLeaderboard(limit);

  console.log('=== Points Leaderboard ===');
  leaderboard.forEach(entry => {
    console.log(`${entry.rank}. ${entry.username} (${entry.steamId})`);
    console.log(`   Points: ${entry.totalPoints} | Achievements: ${entry.achievementCount}`);
  });
}

async function showGameRarestAchievements(
  pointsService: PointsService,
  gameId: number,
  limit: number
) {
  console.log(`Getting rarest achievements for game ${gameId}...\n`);

  const achievements = await pointsService.getGameRarestAchievements(gameId, limit);

  if (achievements.length === 0) {
    console.log('No achievements found for this game.');
    return;
  }

  console.log(`=== Rarest Achievements - ${achievements[0].gameName} ===`);
  achievements.forEach((ach, index) => {
    const rarity = ach.globalPercentage
      ? ` (${ach.globalPercentage.toFixed(2)}% global)`
      : '';
    const hidden = ach.isHidden ? ' [HIDDEN]' : '';
    console.log(`${index + 1}. ${ach.achievementName}${hidden}`);
    console.log(`   Points: ${ach.points}${rarity}`);
  });
}

async function showUserGameBreakdown(pointsService: PointsService, steamIdStr: string) {
  const steamId = BigInt(steamIdStr);
  console.log(`Getting game points breakdown for SteamId ${steamIdStr}...\n`);

  const breakdown = await pointsService.getUserGamePointsBreakdown(steamId);

  if (breakdown.length === 0) {
    console.log('No games found for this user.');
    return;
  }

  console.log('=== Points Breakdown by Game ===');
  breakdown.forEach(game => {
    console.log(`\n${game.gameName}`);
    console.log(`  Unlocked: ${game.unlockedCount}/${game.achievementCount} achievements (${game.completionPercentage.toFixed(1)}%)`);
    console.log(`  Points: ${game.unlockedPoints}/${game.totalPoints}`);
  });

  const totalUnlocked = breakdown.reduce((sum, g) => sum + g.unlockedPoints, 0);
  const totalPossible = breakdown.reduce((sum, g) => sum + g.totalPoints, 0);
  console.log(`\nTotal: ${totalUnlocked}/${totalPossible} points`);
}

// Run
if (require.main === module) {
  main().catch(console.error);
}
