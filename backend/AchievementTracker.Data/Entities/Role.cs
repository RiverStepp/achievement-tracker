using AchievementTracker.Data.Entities.Common;
using AchievementTracker.Data.Enums;

namespace AchievementTracker.Data.Entities;

public sealed class Role: AuditableEntity
{
     public eRole RoleId { get; set; }
     public required string Name { get; set; }
     public string? Description { get; set; }

     #region navigation
     public List<UserRole> UserRoles { get; set; } = [];
     #endregion
}
