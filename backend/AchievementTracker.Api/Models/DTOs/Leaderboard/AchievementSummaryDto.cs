namespace AchievementTracker.Api.Models.DTOs.Leaderboard;
 
public sealed record AchievementSummaryDto(
     int TotalAchievementsUnlocked,
     int TotalGamesTracked,
     int PerfectGamesCount,
     DateTime? LastSyncedDate
);
