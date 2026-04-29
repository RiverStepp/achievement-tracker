using AchievementTracker.Api.Models.DTOs.Leaderboard;
 
namespace AchievementTracker.Api.Services.Interfaces;
 
public interface ILeaderboardService
{
     Task<LeaderboardPageDto> GetLeaderboardAsync(int page, int pageSize, CancellationToken ct = default);
 
     Task<AchievementSummaryDto?> GetUserSummaryAsync(int appUserId, CancellationToken ct = default);
}
