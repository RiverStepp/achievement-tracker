using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Data.Data;
using AchievementTracker.Data.Entities;
using AchievementTracker.Data.Enums;
using Microsoft.EntityFrameworkCore;

namespace AchievementTracker.Api.DataAccess.Repositories;

// Handles all database operations for user notifications
public sealed class NotificationRepository(AppDbContext db) : INotificationRepository
{
     private readonly AppDbContext _db = db;

     // Creates and persists a new notification
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

     // Retrieves a paginated list of notifications for a user using cursor-based pagination, results are ordered newest first.
     public async Task<List<Notification>> GetForUserAsync(int userId, int pageSize, long? beforeNotificationId = null, CancellationToken ct = default)
     {
          var query = _db.Notifications
               .Where(n => n.RecipientAppUserId == userId);

          // If a cursor is provided, only fetch notifications older than that point
          if (beforeNotificationId.HasValue)
               query = query.Where(n => n.NotificationId < beforeNotificationId.Value);

          return await query
               .OrderByDescending(n => n.NotificationId)
               .Take(pageSize)
               .ToListAsync(ct);
     }

     // Returns the number of unread notifications for a user
     public async Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default)
     {
          return await _db.Notifications
               .CountAsync(n => n.RecipientAppUserId == userId && n.ReadDate == null, ct);
     }

     // Marks a single notification as read by setting its ReadDate, only if it belongs to the specified user and hasn't been read yet
     public async Task MarkAsReadAsync(long notificationId, int userId, CancellationToken ct = default)
     {
          await _db.Notifications
               .Where(n => n.NotificationId == notificationId
                    && n.RecipientAppUserId == userId
                    && n.ReadDate == null)
               .ExecuteUpdateAsync(s => s.SetProperty(n => n.ReadDate, DateTime.UtcNow), ct);
     }

     // Marks all unread notifications for a user as read in a single database update
     public async Task MarkAllAsReadAsync(int userId, CancellationToken ct = default)
     {
          await _db.Notifications
               .Where(n => n.RecipientAppUserId == userId && n.ReadDate == null)
               .ExecuteUpdateAsync(s => s.SetProperty(n => n.ReadDate, DateTime.UtcNow), ct);
     }
}
