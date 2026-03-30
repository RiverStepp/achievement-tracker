using AchievementTracker.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AchievementTracker.Api.Controllers;

[ApiController]
[Route("notifications")]
[Authorize]
public class NotificationsController(INotificationService notificationService, ICurrentUser currentUser) : ControllerBase
{
     private readonly INotificationService _notificationService = notificationService;
     private readonly ICurrentUser _currentUser = currentUser;

     // Get notifications for the current user with cursor-based pagination
     [HttpGet]
     public async Task<IActionResult> GetNotifications(
          [FromQuery] int pageSize = 20,
          [FromQuery] long? before = null,
          CancellationToken ct = default)
     {
          int userId = _currentUser.AppUserId!.Value;

          if (pageSize is < 1 or > 100)
               return BadRequest("pageSize must be between 1 and 100.");

          var notifications = await _notificationService.GetNotificationsAsync(userId, pageSize, before, ct);
          return Ok(notifications);
     }

     // Get the unread notification count for the current user
     [HttpGet("unread-count")]
     public async Task<IActionResult> GetUnreadCount(CancellationToken ct)
     {
          int userId = _currentUser.AppUserId!.Value;
          int count = await _notificationService.GetUnreadCountAsync(userId, ct);
          return Ok(new { UnreadCount = count });
     }

     // Mark a single notification as read
     [HttpPost("{notificationId:long}/read")]
     public async Task<IActionResult> MarkAsRead(long notificationId, CancellationToken ct)
     {
          int userId = _currentUser.AppUserId!.Value;
          await _notificationService.MarkAsReadAsync(notificationId, userId, ct);
          return NoContent();
     }

     // Mark all notifications as read for the current user
     [HttpPost("read-all")]
     public async Task<IActionResult> MarkAllAsRead(CancellationToken ct)
     {
          int userId = _currentUser.AppUserId!.Value;
          await _notificationService.MarkAllAsReadAsync(userId, ct);
          return NoContent();
     }
}
