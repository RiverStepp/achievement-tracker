using AchievementTracker.Data.Entities.Common;

namespace AchievementTracker.Data.Entities;

public sealed class SteamTag: AuditableEntity
{
    public int Id { get; set; }
    public required string Name { get; set; }

    #region navigation
    public List<SteamGameTag> GameTags { get; set; } = [];
    #endregion
}

