using AchievementTracker.Data.Entities.Common;

namespace AchievementTracker.Data.Entities;

public sealed class SteamUserAchievement : AuditableEntity
{
    public int Id { get; set; }
    public long SteamId { get; set; }
    public int AchievementId { get; set; }
    public DateTime UnlockedAt { get; set; }

    #region navigation
    public UserSteamProfile UserSteamProfile { get; set; } = null!;
    public SteamAchievement Achievement { get; set; } = null!;
    #endregion
}

