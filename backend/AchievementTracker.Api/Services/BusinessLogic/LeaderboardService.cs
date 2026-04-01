using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.DTOs.Leaderboard;
using AchievementTracker.Api.Services.Interfaces;
 
namespace AchievementTracker.Api.Services.BusinessLogic;
 
public sealed class LeaderboardService(
     ILeaderboardRepository leaderboardRepository
) : ILeaderboardService
{
     private readonly ILeaderboardRepository _leaderboardRepository = leaderboardRepository;
 
     public async Task SyncUserAchievementsAsync(int appUserId, long steamId64, CancellationToken ct = default)
     {
          // Achievement data is already stored in SteamUserAchievements + SteamAchievements. Sync updates the UserAchievementSummaries cache.
          var (totalUnlocked, totalPoints, totalGamesTracked, perfectGames) =
               await _leaderboardRepository.ComputeUserStatsAsync(steamId64, ct);
 
          await _leaderboardRepository.UpsertAchievementSummaryAsync(
               appUserId,
               totalUnlocked,
               totalGamesTracked,
               perfectGames,
               totalPoints,
               ct
          );
     }
 
     public Task<LeaderboardPageDto> GetLeaderboardAsync(int page, int pageSize, CancellationToken ct = default)
          => _leaderboardRepository.GetLeaderboardPageAsync(page, pageSize, ct);
 
     public Task<AchievementSummaryDto?> GetUserSummaryAsync(int appUserId, CancellationToken ct = default)
          => _leaderboardRepository.GetAchievementSummaryAsync(appUserId, ct);
}
