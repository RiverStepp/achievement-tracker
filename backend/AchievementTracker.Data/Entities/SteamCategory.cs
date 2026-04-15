using AchievementTracker.Data.Entities.Common;

namespace AchievementTracker.Data.Entities;

public sealed class SteamCategory: AuditableEntity
{
    public int Id { get; set; }
    public required string Name { get; set; }

    #region navigation
    public List<SteamGameCategory> GameCategories { get; set; } = [];
    #endregion
}

