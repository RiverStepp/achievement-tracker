import { DatabaseService } from '../database/databaseService';
import { ConnectionPool } from 'mssql';

// Points statistics for an achievement
export interface AchievementPoints {
  achievementId: number;
  achievementName: string;
  gameName: string;
  points: number;
  globalPercentage?: number;
  isHidden: boolean;
}

// User points summary
export interface UserPointsSummary {
  userId: number;
  steamId: string;
  username: string;
  totalPoints: number;
  achievementCount: number;
  averagePoints: number;
  topAchievements: AchievementPoints[];
}

// Game points breakdown
export interface GamePointsBreakdown {
  gameId: number;
  gameName: string;
  totalPoints: number;
  achievementCount: number;
  unlockedCount: number;
  unlockedPoints: number;
  completionPercentage: number;
}

export class PointsService {
  private pool: ConnectionPool;
  private dbService: DatabaseService;

  constructor(pool: ConnectionPool) {
    this.pool = pool;
    this.dbService = new DatabaseService(pool);
  }

  // Get total points for a user
  async getUserTotalPoints(userId: number): Promise<number> {
    const result = await this.pool
      .request()
      .input('UserId', userId)
      .query<{ total_points: number }>(`
        SELECT ISNULL(SUM(a.Points), 0) as total_points
        FROM SteamUserAchievements ua
        INNER JOIN SteamAchievements a ON ua.AchievementId = a.Id
        WHERE ua.UserId = @UserId
      `);

    return result.recordset[0]?.total_points || 0;
  }

  // Get detailed points summary for a user
  async getUserPointsSummary(userId: number, topN: number = 10): Promise<UserPointsSummary> {
    // Get basic info
    const userResult = await this.pool
      .request()
      .input('UserId', userId)
      .query<{ steam_id: string; username: string }>(`
        SELECT SteamId as steam_id, Username as username
        FROM SteamUsers
        WHERE Id = @UserId
      `);

    if (!userResult.recordset || userResult.recordset.length === 0) {
      throw new Error(`User ${userId} not found`);
    }

    const user = userResult.recordset[0];

    // Get points stats
    const statsResult = await this.pool
      .request()
      .input('UserId', userId)
      .query<{ total_points: number; achievement_count: number; average_points: number }>(`
        SELECT
          ISNULL(SUM(a.Points), 0) as total_points,
          COUNT(*) as achievement_count,
          ISNULL(AVG(CAST(a.Points as FLOAT)), 0) as average_points
        FROM SteamUserAchievements ua
        INNER JOIN SteamAchievements a ON ua.AchievementId = a.Id
        WHERE ua.UserId = @UserId
      `);

    const stats = statsResult.recordset[0];

    // Get top achievements
    const topResult = await this.pool
      .request()
      .input('UserId', userId)
      .input('TopN', topN)
      .query<{
        achievement_id: number;
        achievement_name: string;
        game_name: string;
        points: number;
        global_percentage: number | null;
        is_hidden: boolean;
      }>(`
        SELECT TOP (@TopN)
          a.Id as achievement_id,
          a.Name as achievement_name,
          g.Name as game_name,
          a.Points as points,
          ast.GlobalPercentage as global_percentage,
          a.IsHidden as is_hidden
        FROM SteamUserAchievements ua
        INNER JOIN SteamAchievements a ON ua.AchievementId = a.Id
        INNER JOIN SteamGames g ON a.GameId = g.Id
        LEFT JOIN SteamAchievementStats ast ON a.Id = ast.AchievementId
        WHERE ua.UserId = @UserId
        ORDER BY a.Points DESC
      `);

    const topAchievements: AchievementPoints[] = topResult.recordset.map(row => ({
      achievementId: row.achievement_id,
      achievementName: row.achievement_name,
      gameName: row.game_name,
      points: row.points,
      globalPercentage: row.global_percentage ?? undefined,
      isHidden: row.is_hidden
    }));

    return {
      userId,
      steamId: user.steam_id,
      username: user.username,
      totalPoints: stats.total_points,
      achievementCount: stats.achievement_count,
      averagePoints: stats.average_points,
      topAchievements
    };
  }

  // Get points breakdown by game for a user
  async getUserGamePointsBreakdown(userId: number): Promise<GamePointsBreakdown[]> {
    const result = await this.pool
      .request()
      .input('UserId', userId)
      .query<{
        game_id: number;
        game_name: string;
        total_points: number;
        achievement_count: number;
        unlocked_count: number;
        unlocked_points: number;
      }>(`
        SELECT
          g.Id as game_id,
          g.Name as game_name,
          ISNULL(SUM(a.Points), 0) as total_points,
          COUNT(a.Id) as achievement_count,
          COUNT(ua.Id) as unlocked_count,
          ISNULL(SUM(CASE WHEN ua.Id IS NOT NULL THEN a.Points ELSE 0 END), 0) as unlocked_points
        FROM SteamGames g
        INNER JOIN SteamAchievements a ON g.Id = a.GameId
        INNER JOIN SteamUserGames ug ON g.Id = ug.GameId AND ug.UserId = @UserId
        LEFT JOIN SteamUserAchievements ua ON a.Id = ua.AchievementId AND ua.UserId = @UserId
        GROUP BY g.Id, g.Name
        HAVING COUNT(a.Id) > 0
        ORDER BY unlocked_points DESC
      `);

    return result.recordset.map(row => ({
      gameId: row.game_id,
      gameName: row.game_name,
      totalPoints: row.total_points,
      achievementCount: row.achievement_count,
      unlockedCount: row.unlocked_count,
      unlockedPoints: row.unlocked_points,
      completionPercentage: row.achievement_count > 0
        ? (row.unlocked_count / row.achievement_count) * 100
        : 0
    }));
  }

  // Get leaderboard of users by points
  async getLeaderboard(limit: number = 100, offset: number = 0): Promise<Array<{
    rank: number;
    userId: number;
    steamId: string;
    username: string;
    totalPoints: number;
    achievementCount: number;
  }>> {
    const result = await this.pool
      .request()
      .input('Limit', limit)
      .input('Offset', offset)
      .query<{
        row_num: number;
        user_id: number;
        steam_id: string;
        username: string;
        total_points: number;
        achievement_count: number;
      }>(`
        WITH RankedUsers AS (
          SELECT
            u.Id as user_id,
            CAST(u.SteamId AS VARCHAR(50)) as steam_id,
            u.Username as username,
            ISNULL(SUM(a.Points), 0) as total_points,
            COUNT(ua.Id) as achievement_count,
            ROW_NUMBER() OVER (ORDER BY ISNULL(SUM(a.Points), 0) DESC) as row_num
          FROM SteamUsers u
          LEFT JOIN SteamUserAchievements ua ON u.Id = ua.UserId
          LEFT JOIN SteamAchievements a ON ua.AchievementId = a.Id
          WHERE u.IsActive = 1
          GROUP BY u.Id, u.SteamId, u.Username
        )
        SELECT *
        FROM RankedUsers
        WHERE row_num > @Offset AND row_num <= (@Offset + @Limit)
        ORDER BY row_num
      `);

    return result.recordset.map(row => ({
      rank: row.row_num,
      userId: row.user_id,
      steamId: row.steam_id,
      username: row.username,
      totalPoints: row.total_points,
      achievementCount: row.achievement_count
    }));
  }

  // Get points for a specific achievement
  async getAchievementPoints(achievementId: number): Promise<number> {
    const result = await this.pool
      .request()
      .input('AchievementId', achievementId)
      .query<{ points: number }>(`
        SELECT ISNULL(Points, 0) as points
        FROM SteamAchievements
        WHERE Id = @AchievementId
      `);

    return result.recordset[0]?.points || 0;
  }

  // Get rarest achievements (highest points) for a game
  async getGameRarestAchievements(gameId: number, limit: number = 10): Promise<AchievementPoints[]> {
    const result = await this.pool
      .request()
      .input('GameId', gameId)
      .input('Limit', limit)
      .query<{
        achievement_id: number;
        achievement_name: string;
        game_name: string;
        points: number;
        global_percentage: number | null;
        is_hidden: boolean;
      }>(`
        SELECT TOP (@Limit)
          a.Id as achievement_id,
          a.Name as achievement_name,
          g.Name as game_name,
          a.Points as points,
          ast.GlobalPercentage as global_percentage,
          a.IsHidden as is_hidden
        FROM SteamAchievements a
        INNER JOIN SteamGames g ON a.GameId = g.Id
        LEFT JOIN SteamAchievementStats ast ON a.Id = ast.AchievementId
        WHERE a.GameId = @GameId
        ORDER BY a.Points DESC
      `);

    return result.recordset.map(row => ({
      achievementId: row.achievement_id,
      achievementName: row.achievement_name,
      gameName: row.game_name,
      points: row.points,
      globalPercentage: row.global_percentage ?? undefined,
      isHidden: row.is_hidden
    }));
  }
}
