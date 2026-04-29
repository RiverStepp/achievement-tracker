using AchievementTracker.Api.Models.DTOs.Leaderboard;

namespace AchievementTracker.Api.DataAccess.Interfaces;

public interface ILeaderboardRepository
{
     Task<(int TotalUnlocked, int TotalPoints, int TotalGamesTracked, int PerfectGames)> ComputeUserStatsAsync(
          long steamId64,
          CancellationToken ct = default);

     Task<AchievementSummaryDto?> GetAchievementSummaryAsync(int appUserId, CancellationToken ct = default);

     Task<LeaderboardPageDto> GetLeaderboardPageAsync(int page, int pageSize, CancellationToken ct = default);
}
