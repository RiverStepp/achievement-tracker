using AchievementTracker.Data.Enums;

namespace AchievementTracker.Api.Models.Responses.Settings;

public sealed record UserSettingsSocialLinkResponseDto(
    eSocialPlatform Platform,
    string LinkValue,
    bool IsVisible);
