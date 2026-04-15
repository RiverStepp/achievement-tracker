using AchievementTracker.Data.Entities.Common;

namespace AchievementTracker.Data.Entities;

public sealed class SteamPublisher: AuditableEntity
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? PageUrl { get; set; }

    #region navigation
    public List<SteamGamePublisher> GamePublishers { get; set; } = [];
    #endregion
}

