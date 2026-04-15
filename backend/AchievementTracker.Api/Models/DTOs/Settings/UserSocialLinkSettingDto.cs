using AchievementTracker.Data.Enums;

namespace AchievementTracker.Api.Models.DTOs.Settings;

public sealed record UserSocialLinkSettingDto
{
    public eSocialPlatform Platform { get; init; }
    public string? LinkValue { get; init; }
    public bool IsVisible { get; init; }
}
