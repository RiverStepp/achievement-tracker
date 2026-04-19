namespace AchievementTracker.Api.Models.Responses.Profile;

public sealed record ProfileGameItemDto(
    string GameName,
    string? HeaderImageUrl,
    int? PlaytimeForever,
    int EarnedCount,
    int TotalAchievements,
    decimal? PercentCompletion,
    bool IsCompleted,
    int PointsEarned,
    int PointsAvailable,
    DateTime LatestUnlockDate,
    int? DurationMinutes
);
