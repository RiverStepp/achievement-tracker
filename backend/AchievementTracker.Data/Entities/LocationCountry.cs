namespace AchievementTracker.Data.Entities;

public sealed class LocationCountry
{
    public int LocationCountryId { get; set; }
    public string IsoAlpha2 { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    public List<LocationStateRegion> StateRegions { get; set; } = [];
}
