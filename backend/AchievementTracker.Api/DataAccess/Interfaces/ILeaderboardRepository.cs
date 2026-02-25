using AchievementTracker.Api.Models.DTOs.Leaderboard;

namespace AchievementTracker.Api.DataAccess.Interfaces;

public interface ILeaderboardRepository
{
     Task UpsertAchievementSummaryAsync(
          int appUserId,
          int totalAchievementsUnlocked,
          int totalGamesTracked,
          int perfectGamesCount,
          CancellationToken ct = default
     );

     Task<AchievementSummaryDto?> GetAchievementSummaryAsync(int appUserId, CancellationToken ct = default);

     Task<LeaderboardPageDto> GetLeaderboardPageAsync(int page, int pageSize, CancellationToken ct = default);
}
