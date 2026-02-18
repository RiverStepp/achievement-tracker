using AchievementTracker.Data.Entities.Common;
using AchievementTracker.Data.Enums;

namespace AchievementTracker.Data.Entities;

public sealed class UserExternalLogin: AuditableEntity
{
     public int UserExternalLoginId { get; set; }
     public int AppUserId { get; set; }
     public eAuthProvider AuthProvider { get; set; }
     public required string ProviderUserId { get; set; }

     #region navigation
     public AppUser AppUser { get; set; } = null!;
     public UserSteamProfile? SteamProfile { get; set; }
     #endregion
}
