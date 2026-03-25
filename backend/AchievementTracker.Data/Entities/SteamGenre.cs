using AchievementTracker.Data.Entities.Common;

namespace AchievementTracker.Data.Entities;

public sealed class SteamGenre: AuditableEntity
{
    public int Id { get; set; }
    public required string Name { get; set; }

    #region navigation
    public List<SteamGameGenre> GameGenres { get; set; } = [];
    #endregion
}

