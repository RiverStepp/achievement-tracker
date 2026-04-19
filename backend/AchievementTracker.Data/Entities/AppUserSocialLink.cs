using AchievementTracker.Data.Entities.Common;
using AchievementTracker.Data.Enums;

namespace AchievementTracker.Data.Entities;

public sealed class AppUserSocialLink : AuditableEntity
{
    public int AppUserSocialLinkId { get; set; }
    public int AppUserId { get; set; }
    public eSocialPlatform Platform { get; set; }
    public string LinkValue { get; set; } = string.Empty;
    public bool IsVisible { get; set; }

    public AppUser AppUser { get; set; } = null!;
}
