namespace AchievementTracker.Api.Models.DTOs.Leaderboard;
 
public sealed record LeaderboardPageDto(
     IReadOnlyList<LeaderboardEntryDto> Entries,
     int TotalCount,
     int Page,
     int PageSize
);
