namespace AchievementTracker.Api.Models.DTOs.Leaderboard;
 
public sealed record LeaderboardEntryDto(
     int Rank,
     Guid PublicId,
     string? PersonaName,
     string? AvatarUrl,
     string? ProfileUrl,
     int TotalAchievementsUnlocked,
     int TotalGamesTracked,
     int PerfectGamesCount,
     DateTime? LastSyncedDate
);
