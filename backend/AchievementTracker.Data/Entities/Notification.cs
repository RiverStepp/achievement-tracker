using AchievementTracker.Data.Entities.Common;
using AchievementTracker.Data.Enums;

namespace AchievementTracker.Data.Entities;

public sealed class Notification : AuditableEntity
{
     public long NotificationId { get; set; }
     public int RecipientAppUserId { get; set; }
     public int ActorAppUserId { get; set; }
     public eNotificationType NotificationType { get; set; }
     public string? ReferenceId { get; set; }
     public DateTime? ReadDate { get; set; }

     #region navigation
     public AppUser Recipient { get; set; } = null!;
     public AppUser Actor { get; set; } = null!;
     #endregion
}
