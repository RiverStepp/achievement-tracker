using AchievementTracker.Data.Entities.Common;

namespace AchievementTracker.Data.Entities;

public sealed class SteamDeveloper : AuditableEntity
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? PageUrl { get; set; }

    #region navigation
    public List<SteamGameDeveloper> GameDevelopers { get; set; } = [];
    #endregion
}

