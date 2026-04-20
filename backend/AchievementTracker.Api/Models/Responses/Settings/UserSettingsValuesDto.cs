namespace AchievementTracker.Api.Models.Responses.Settings;

public sealed record UserSettingsValuesDto(
    string? DisplayName,
    string? Handle,
    string? Bio,
    UserSettingsLocationResponseDto? Location,
    UserSettingsTimeZoneResponseDto? TimeZone,
    UserSettingsPronounResponseDto? Pronouns,
    IReadOnlyList<UserSettingsSocialLinkResponseDto> SocialLinks,
    UserSettingsMediaAssetDto ProfileImage,
    UserSettingsMediaAssetDto BannerImage);
