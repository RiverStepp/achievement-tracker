namespace AchievementTracker.Api.Models.Responses.Profile;

public sealed record ProfileAchievementItemDto(
    int GameId,
    string GameName,
    string AchievementName,
    string? IconUrl,
    string? Description,
    decimal? Rarity,
    DateTime UnlockDate,
    int Points
);
