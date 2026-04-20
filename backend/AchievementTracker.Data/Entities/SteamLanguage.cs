using AchievementTracker.Data.Entities.Common;

namespace AchievementTracker.Data.Entities;

public sealed class SteamLanguage: AuditableEntity
{
    public int Id { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }

    #region navigation
    public List<SteamGameLanguage> GameLanguages { get; set; } = [];
    #endregion
}

