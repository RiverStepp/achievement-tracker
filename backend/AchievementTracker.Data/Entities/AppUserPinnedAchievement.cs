using AchievementTracker.Data.Entities.Common;
using AchievementTracker.Data.Enums;

namespace AchievementTracker.Data.Entities;

public sealed class AppUserPinnedAchievement : AuditableEntity
{
    public int AppUserPinnedAchievementId { get; set; }
    public int AppUserId { get; set; }
    public eAchievementPlatform PlatformId { get; set; }
    public int SteamAchievementId { get; set; }
    public int DisplayOrder { get; set; }

    public AppUser AppUser { get; set; } = null!;
    public SteamAchievement SteamAchievement { get; set; } = null!;
}
