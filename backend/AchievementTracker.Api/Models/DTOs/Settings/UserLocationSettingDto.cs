namespace AchievementTracker.Api.Models.DTOs.Settings;

public sealed record UserLocationSettingDto
{
    public int? CountryId { get; init; }
    public int? StateRegionId { get; init; }
    public int? CityId { get; init; }
}
