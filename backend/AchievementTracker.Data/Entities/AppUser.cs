using AchievementTracker.Data.Entities.Common;

namespace AchievementTracker.Data.Entities;

public sealed class AppUser: AuditableEntity
{
     public int AppUserId { get; set; }
     public Guid PublicId { get; set; }
     public string? Handle { get; set; }
     public string? DisplayName { get; set; }
     public bool IsListedOnLeaderboards { get; set; }
     public DateTime? LastLoginDate { get; set; }

     #region navigation
     public List<UserExternalLogin> ExternalLogins { get; set; } = [];
     public List<AppUserPinnedAchievement> PinnedAchievements { get; set; } = [];
     public List<SocialPost> SocialPosts { get; set; } = [];
     public List<UserRole> UserRoles { get; set; } = [];
     #endregion
}

