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
          int userId = RequireUserId();

          if (pageSize is < 1 or > 100)
               return BadRequest("pageSize must be between 1 and 100.");

          var notifications = await _notificationService.GetNotificationsAsync(userId, pageSize, before, ct);
          return Ok(notifications);
     }

     // Get the unread notification count for the current user
     [HttpGet("unread-count")]
     public async Task<IActionResult> GetUnreadCount(CancellationToken ct)
     {
          int userId = RequireUserId();
          int count = await _notificationService.GetUnreadCountAsync(userId, ct);
          return Ok(new { unreadCount = count });
     }

     // Mark a single notification as read
     [HttpPost("{notificationId:long}/read")]
     public async Task<IActionResult> MarkAsRead(long notificationId, CancellationToken ct)
     {
          int userId = RequireUserId();
          await _notificationService.MarkAsReadAsync(notificationId, userId, ct);
          return NoContent();
     }

     // Mark all notifications as read for the current user
     [HttpPost("read-all")]
     public async Task<IActionResult> MarkAllAsRead(CancellationToken ct)
     {
          int userId = RequireUserId();
          await _notificationService.MarkAllAsReadAsync(userId, ct);
          return NoContent();
     }

     private int RequireUserId()
     {
          return _currentUser.AppUserId
               ?? throw new UnauthorizedAccessException("User is not authenticated.");
     }
}
