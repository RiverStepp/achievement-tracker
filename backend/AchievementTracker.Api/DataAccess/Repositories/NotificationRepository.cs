using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Data.Data;
using AchievementTracker.Data.Entities;
using AchievementTracker.Data.Enums;
using Microsoft.EntityFrameworkCore;

namespace AchievementTracker.Api.DataAccess.Repositories;

public sealed class NotificationRepository(AppDbContext db) : INotificationRepository
{
     private readonly AppDbContext _db = db;

     public async Task<Notification> CreateAsync(int recipientUserId, int actorUserId, eNotificationType type, string? referenceId = null, CancellationToken ct = default)
     {
          var notification = new Notification
          {
               RecipientAppUserId = recipientUserId,
               ActorAppUserId = actorUserId,
               NotificationType = type,
               ReferenceId = referenceId,
          };

          _db.Notifications.Add(notification);
          await _db.SaveChangesAsync(ct);

          return notification;
     }

     public async Task<List<Notification>> GetForUserAsync(int userId, int pageSize, long? beforeNotificationId = null, CancellationToken ct = default)
     {
          var query = _db.Notifications
               .Include(n => n.Actor)
               .Where(n => n.RecipientAppUserId == userId && n.IsActive);

          if (beforeNotificationId.HasValue)
               query = query.Where(n => n.NotificationId < beforeNotificationId.Value);

          return await query
               .OrderByDescending(n => n.NotificationId)
               .Take(pageSize)
               .ToListAsync(ct);
     }

     public async Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default)
     {
          return await _db.Notifications
               .CountAsync(n => n.RecipientAppUserId == userId && n.IsActive && n.ReadDate == null, ct);
     }

     public async Task MarkAsReadAsync(long notificationId, int userId, CancellationToken ct = default)
     {
          await _db.Notifications
               .Where(n => n.NotificationId == notificationId
                    && n.RecipientAppUserId == userId
                    && n.IsActive
                    && n.ReadDate == null)
               .ExecuteUpdateAsync(s => s.SetProperty(n => n.ReadDate, DateTime.UtcNow), ct);
     }

     public async Task MarkAllAsReadAsync(int userId, CancellationToken ct = default)
     {
          await _db.Notifications
               .Where(n => n.RecipientAppUserId == userId && n.IsActive && n.ReadDate == null)
               .ExecuteUpdateAsync(s => s.SetProperty(n => n.ReadDate, DateTime.UtcNow), ct);
     }
}
