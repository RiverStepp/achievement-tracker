namespace AchievementTracker.Api.Models.Responses.Settings;

public sealed record UserSettingsResponseDto(
    string? DisplayName,
    string? Handle,
    string? Bio,
    UserSettingsLocationResponseDto? Location,
    UserSettingsTimeZoneResponseDto? TimeZone,
    UserSettingsPronounResponseDto? Pronouns,
    IReadOnlyList<UserSettingsSocialLinkResponseDto> SocialLinks,
    UserSettingsMediaAssetDto ProfileImage,
    UserSettingsMediaAssetDto BannerImage,
    IReadOnlyList<LocationCountryOptionDto> Countries,
    IReadOnlyList<IanaTimeZoneOptionDto> IanaTimeZones,
    IReadOnlyList<PronounOptionItemDto> PronounOptions);
