using AchievementTracker.Data.Enums;

namespace AchievementTracker.Api.Models.Requests;

public sealed class PinMyAchievementRequestDto
{
    public int SteamAchievementId { get; set; }

    public eAchievementPlatform PlatformId { get; set; } = eAchievementPlatform.Steam;
}