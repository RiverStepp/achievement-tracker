namespace AchievementTracker.Api.Models.Responses.Steam;

public sealed record AchievementSearchItemDto(
    int AchievementId,
    string AchievementName,
    string? AchievementDescription,
    string? AchievementIconUrl,
    int AchievementPoints,
    decimal? GlobalPercentage,
    int GameId,
    string GameName,
    string? GameHeaderImageUrl
);
