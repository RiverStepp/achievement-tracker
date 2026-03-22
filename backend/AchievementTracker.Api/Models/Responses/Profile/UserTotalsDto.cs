namespace AchievementTracker.Api.Models.Responses.Profile;

public sealed record UserTotalsDto(
    int TotalPoints,
    int TotalAchievements,
    int TotalPlaytimeMinutes,
    int GamesAt100Percent,
    int StartedGamesCount,
    int OwnedGamesCount,
    decimal? AvgCompletionPercent
);
