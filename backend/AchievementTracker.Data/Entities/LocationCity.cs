namespace AchievementTracker.Data.Entities;

public sealed class LocationCity
{
    public int LocationCityId { get; set; }
    public int LocationStateRegionId { get; set; }
    public string Name { get; set; } = string.Empty;

    public LocationStateRegion StateRegion { get; set; } = null!;
}
