namespace AchievementTracker.Api.Models.Responses.Profile;

public sealed record ProfileUserLocationDto(
    int? CountryId,
    string? CountryName,
    int? StateRegionId,
    string? StateName,
    int? CityId,
    string? CityName);
