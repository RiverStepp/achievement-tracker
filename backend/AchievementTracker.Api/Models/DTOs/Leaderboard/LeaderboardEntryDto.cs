namespace AchievementTracker.Api.Models.DTOs.Leaderboard;
 
public sealed record LeaderboardEntryDto(
     int Rank,
    Guid? PublicId,
    long SteamProfileId,
    bool IsClaimed,
     string? PersonaName,
     string? AvatarUrl,
     string? ProfileUrl,
     int TotalAchievementsUnlocked,
     int TotalGamesTracked,
     int PerfectGamesCount,
     int TotalPoints,
     DateTime? LastSyncedDate
);
