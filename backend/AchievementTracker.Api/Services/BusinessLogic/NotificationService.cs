using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Hubs;
using AchievementTracker.Api.Models.DTOs.Notifications;
using AchievementTracker.Api.Services.Interfaces;
using AchievementTracker.Data.Entities;
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

          Notification notification = await _notificationRepo.CreateAsync(recipientUserId, actorUserId, type, referenceId, ct);

          (Guid actorPublicId, _, _) = await _appUserRepository.GetPublicIdHandleAndDisplayNameAsync(actorUserId, ct);
          NotificationDto dto = ToDto(notification, actorPublicId);

          (Guid recipientPublicId, _, _) = await _appUserRepository.GetPublicIdHandleAndDisplayNameAsync(recipientUserId, ct);
          if (recipientPublicId == Guid.Empty)
               return dto;

          await _hubContext.Clients
               .Group($"user-{recipientPublicId}")
               .SendAsync("ReceiveNotification", dto, ct);

          return dto;
     }

     public async Task<List<NotificationDto>> GetNotificationsAsync(int userId, int pageSize, long? beforeNotificationId = null, CancellationToken ct = default)
     {
          List<Notification> notifications = await _notificationRepo.GetForUserAsync(userId, pageSize, beforeNotificationId, ct);

          return notifications.Select(n => ToDto(n, n.Actor.PublicId)).ToList();
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

     private static NotificationDto ToDto(Notification n, Guid actorPublicId)
     {
          return new NotificationDto
          {
               NotificationId = n.NotificationId,
               ActorPublicId = actorPublicId,
               NotificationType = n.NotificationType,
               ReferenceId = n.ReferenceId,
               CreateDate = n.CreateDate,
               ReadDate = n.ReadDate
          };
     }
}
