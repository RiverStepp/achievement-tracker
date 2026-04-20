namespace AchievementTracker.Api.Models.Responses.Settings;

public sealed record LocationStateRegionOptionDto(
    int LocationStateRegionId,
    int LocationCountryId,
    string Code,
    string Name);
