using AchievementTracker.Data.Entities.Common;

namespace AchievementTracker.Data.Entities;

public sealed class SteamUserGame: AuditableEntity
{
    public int Id { get; set; }
    public long SteamId { get; set; }
    public int GameId { get; set; }
    public int PlaytimeForever { get; set; }
    public DateTime? LastPlayedAt { get; set; }

    #region navigation
    public UserSteamProfile UserSteamProfile { get; set; } = null!;
    public SteamGame Game { get; set; } = null!;
    #endregion
}

