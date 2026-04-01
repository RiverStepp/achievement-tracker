namespace AchievementTracker.Data.Entities;

public sealed class LocationStateRegion
{
    public int LocationStateRegionId { get; set; }
    public int LocationCountryId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    public LocationCountry Country { get; set; } = null!;
    public List<LocationCity> Cities { get; set; } = [];
}
