using AchievementTracker.Data.Enums;

namespace AchievementTracker.Api.Models.Responses.Profile;

public sealed record ProfilePinnedAchievementDto(
    int AppUserPinnedAchievementId,
    int DisplayOrder,
    eAchievementPlatform PlatformId,
    int SteamAchievementId,
    int GameId,
    string GameName,
    string AchievementName,
    string? IconUrl,
    string? Description,
    decimal? Rarity,
    DateTime UnlockDate,
    int Points
);