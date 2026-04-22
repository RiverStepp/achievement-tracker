using AchievementTracker.Data.Enums;

namespace AchievementTracker.Api.Models.DTOs.Notifications;

public sealed class NotificationDto
{
     public long NotificationId { get; set; }
     public Guid ActorPublicId { get; set; }
     public eNotificationType NotificationType { get; set; }
     public string? ReferenceId { get; set; }
     public DateTime CreateDate { get; set; }
     public DateTime? ReadDate { get; set; }
}
