using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.DTOs.Leaderboard;
using AchievementTracker.Api.Services.Interfaces;

namespace AchievementTracker.Api.Services.BusinessLogic;

public sealed class LeaderboardService(
     ILeaderboardRepository leaderboardRepository
) : ILeaderboardService
{
     private readonly ILeaderboardRepository _leaderboardRepository = leaderboardRepository;

     public Task<LeaderboardPageDto> GetLeaderboardAsync(int page, int pageSize, CancellationToken ct = default)
          => _leaderboardRepository.GetLeaderboardPageAsync(page, pageSize, ct);

     public Task<AchievementSummaryDto?> GetUserSummaryAsync(int appUserId, CancellationToken ct = default)
          => _leaderboardRepository.GetAchievementSummaryAsync(appUserId, ct);
}
