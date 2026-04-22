using AchievementTracker.Api.Models.DTOs.Notifications;
using AchievementTracker.Data.Enums;

namespace AchievementTracker.Api.Services.Interfaces;

public interface INotificationService
{
     Task<NotificationDto?> CreateAndDispatchAsync(int recipientUserId, int actorUserId, eNotificationType type, string? referenceId = null, CancellationToken ct = default);
     Task<List<NotificationDto>> GetNotificationsAsync(int userId, int pageSize, long? beforeNotificationId = null, CancellationToken ct = default);
     Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default);
     Task MarkAsReadAsync(long notificationId, int userId, CancellationToken ct = default);
     Task MarkAllAsReadAsync(int userId, CancellationToken ct = default);
}
