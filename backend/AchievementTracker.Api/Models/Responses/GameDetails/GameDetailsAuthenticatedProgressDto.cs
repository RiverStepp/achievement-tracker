namespace AchievementTracker.Api.Models.Responses.GameDetails;

public sealed record GameDetailsAuthenticatedProgressDto(
    int PointsEarned,
    int UnlockedAchievementCount,
    int LockedAchievementCount,
    decimal? AchievementCompletionPercent);
