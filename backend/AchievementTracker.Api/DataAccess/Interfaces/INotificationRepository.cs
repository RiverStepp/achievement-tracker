using AchievementTracker.Data.Entities;
using AchievementTracker.Data.Enums;

namespace AchievementTracker.Api.DataAccess.Interfaces;

public interface INotificationRepository
{
     Task<Notification> CreateAsync(int recipientUserId, int actorUserId, eNotificationType type, string? referenceId = null, CancellationToken ct = default);
     Task<List<Notification>> GetForUserAsync(int userId, int pageSize, long? beforeNotificationId = null, CancellationToken ct = default);
     Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default);
     Task MarkAsReadAsync(long notificationId, int userId, CancellationToken ct = default);
     Task MarkAllAsReadAsync(int userId, CancellationToken ct = default);
}
