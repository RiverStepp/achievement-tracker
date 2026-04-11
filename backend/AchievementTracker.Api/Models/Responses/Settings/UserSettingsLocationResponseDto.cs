namespace AchievementTracker.Api.Models.Responses.Settings;

public sealed record UserSettingsLocationResponseDto(
    int? CountryId,
    string? CountryName,
    int? StateRegionId,
    string? StateName,
    int? CityId,
    string? CityName);
