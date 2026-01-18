using AchievementTracker.Data.Enums;

namespace AchievementTracker.Data.Entities;

public sealed class UserRole
{
     public int AppUserId { get; set; }
     public eRole RoleId { get; set; }

     #region navigation
     public AppUser AppUser { get; set; } = null!;
     public Role Role { get; set; } = null!;
     #endregion
}

