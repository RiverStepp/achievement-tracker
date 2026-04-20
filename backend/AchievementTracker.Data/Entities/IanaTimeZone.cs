namespace AchievementTracker.Data.Entities;

public sealed class IanaTimeZone
{
    public int IanaTimeZoneId { get; set; }
    public string IanaIdentifier { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
}
