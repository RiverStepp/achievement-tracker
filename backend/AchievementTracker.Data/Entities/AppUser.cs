using AchievementTracker.Data.Entities.Common;

namespace AchievementTracker.Data.Entities;

public sealed class AppUser: AuditableEntity
{
     public int AppUserId { get; set; }
     public Guid PublicId { get; set; }
     public bool IsListedOnLeaderboards { get; set; }
     public DateTime? LastLoginDate { get; set; }

     #region navigation
     public List<UserExternalLogin> ExternalLogins { get; set; } = [];
     public List<UserRole> UserRoles { get; set; } = [];
     #endregion
}

