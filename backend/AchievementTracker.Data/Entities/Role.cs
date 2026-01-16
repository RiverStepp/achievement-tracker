using AchievementTracker.Data.Entities.Common;

namespace AchievementTracker.Data.Entities;

public sealed class Role: AuditableEntity
{
     public int RoleId { get; set; }
     public required string Name { get; set; }
     public string? Description { get; set; }

     #region navigation
     public List<UserRole> UserRoles { get; set; } = [];
     #endregion
}
