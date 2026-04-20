using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Hubs;
using AchievementTracker.Api.Models.DTOs.Notifications;
using AchievementTracker.Api.Services.Interfaces;
using AchievementTracker.Data.Enums;
using Microsoft.AspNetCore.SignalR;

namespace AchievementTracker.Api.Services.BusinessLogic;

public sealed class NotificationService(
     INotificationRepository notificationRepo,
     IAppUserRepository appUserRepository,
     IHubContext<ChatHub> hubContext) : INotificationService
{
     private readonly INotificationRepository _notificationRepo = notificationRepo;
     private readonly IAppUserRepository _appUserRepository = appUserRepository;
     private readonly IHubContext<ChatHub> _hubContext = hubContext;

     public async Task<NotificationDto?> CreateAndDispatchAsync(int recipientUserId, int actorUserId, eNotificationType type, string? referenceId = null, CancellationToken ct = default)
     {
          if (recipientUserId == actorUserId)
               return null;

          var notification = await _notificationRepo.CreateAsync(recipientUserId, actorUserId, type, referenceId, ct);

          var dto = MapToDto(notification);

          (Guid recipientPublicId, _, _) = await _appUserRepository.GetPublicIdHandleAndDisplayNameAsync(recipientUserId, ct);
          if (recipientPublicId == Guid.Empty)
               return dto;

          // Push to the recipient in real time via their SignalR user group (same key as ChatHub)
          await _hubContext.Clients
               .Group($"user-{recipientPublicId}")
               .SendAsync("ReceiveNotification", dto, ct);

          return dto;
     }

     public async Task<List<NotificationDto>> GetNotificationsAsync(int userId, int pageSize, long? beforeNotificationId = null, CancellationToken ct = default)
     {
          var notifications = await _notificationRepo.GetForUserAsync(userId, pageSize, beforeNotificationId, ct);

          return notifications.Select(MapToDto).ToList();
     }

     public async Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default)
     {
          return await _notificationRepo.GetUnreadCountAsync(userId, ct);
     }

     public async Task MarkAsReadAsync(long notificationId, int userId, CancellationToken ct = default)
     {
          await _notificationRepo.MarkAsReadAsync(notificationId, userId, ct);
     }

     public async Task MarkAllAsReadAsync(int userId, CancellationToken ct = default)
     {
          await _notificationRepo.MarkAllAsReadAsync(userId, ct);
     }

     private static NotificationDto MapToDto(Data.Entities.Notification n)
     {
          return new NotificationDto
          {
               NotificationId = n.NotificationId,
               ActorAppUserId = n.ActorAppUserId,
               NotificationType = n.NotificationType,
               ReferenceId = n.ReferenceId,
               CreateDate = n.CreateDate,
               ReadDate = n.ReadDate
          };
     }
}
