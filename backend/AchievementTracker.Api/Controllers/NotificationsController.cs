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

     [HttpGet]
     public async Task<IActionResult> GetNotifications(
          [FromQuery] int pageSize = 20,
          [FromQuery] long? before = null,
          CancellationToken ct = default)
     {
          if (!TryGetAuthenticatedUserId(out int userId))
               return Unauthorized();

          if (pageSize is < 1 or > 100)
               return BadRequest("pageSize must be between 1 and 100.");

          var notifications = await _notificationService.GetNotificationsAsync(userId, pageSize, before, ct);
          return Ok(notifications);
     }

     [HttpGet("unread-count")]
     public async Task<IActionResult> GetUnreadCount(CancellationToken ct)
     {
          if (!TryGetAuthenticatedUserId(out int userId))
               return Unauthorized();

          int count = await _notificationService.GetUnreadCountAsync(userId, ct);
          return Ok(new { UnreadCount = count });
     }

     [HttpPost("{notificationId:long}/read")]
     public async Task<IActionResult> MarkAsRead(long notificationId, CancellationToken ct)
     {
          if (!TryGetAuthenticatedUserId(out int userId))
               return Unauthorized();

          await _notificationService.MarkAsReadAsync(notificationId, userId, ct);
          return NoContent();
     }

     [HttpPost("read-all")]
     public async Task<IActionResult> MarkAllAsRead(CancellationToken ct)
     {
          if (!TryGetAuthenticatedUserId(out int userId))
               return Unauthorized();

          await _notificationService.MarkAllAsReadAsync(userId, ct);
          return NoContent();
     }

     private bool TryGetAuthenticatedUserId(out int userId)
     {
          if (_currentUser.AppUserId is int id && id > 0)
          {
               userId = id;
               return true;
          }

          userId = default;
          return false;
     }
}
