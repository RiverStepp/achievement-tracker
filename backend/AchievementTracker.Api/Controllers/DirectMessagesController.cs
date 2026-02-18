using AchievementTracker.Api.Models.DTOs.DirectMessages;
using AchievementTracker.Api.Services.Interfaces;
using AchievementTracker.Data.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AchievementTracker.Api.Controllers;

[ApiController]
[Route("dm")]
[Authorize]
public class DirectMessagesController(
     IDirectMessageService dmService,
     INotificationService notificationService,
     ICurrentUser currentUser) : ControllerBase
{
     private readonly IDirectMessageService _dmService = dmService;
     private readonly INotificationService _notificationService = notificationService;
     private readonly ICurrentUser _currentUser = currentUser;

     // Get all conversations for the current user.
     [HttpGet("conversations")]
     public async Task<IActionResult> GetConversations(CancellationToken ct)
     {
          int userId = RequireUserId();
          var conversations = await _dmService.GetConversationsAsync(userId, ct);
          return Ok(conversations);
     }

     // Get message history for a specific conversation with cursor-based pagination.
     [HttpGet("conversations/{conversationId:int}/messages")]
     public async Task<IActionResult> GetMessages(
          int conversationId,
          [FromQuery] int pageSize = 50,
          [FromQuery] long? before = null,
          CancellationToken ct = default)
     {
          int userId = RequireUserId();

          if (pageSize is < 1 or > 100)
               return BadRequest("pageSize must be between 1 and 100.");

          var messages = await _dmService.GetMessageHistoryAsync(conversationId, userId, pageSize, before, ct);
          return Ok(messages);
     }

     // Send a direct message via REST 
     [HttpPost("send")]
     public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request, CancellationToken ct)
     {
          int userId = RequireUserId();
          var message = await _dmService.SendMessageAsync(userId, request, ct);

          // Dispatch a notification to the recipient 
          await _notificationService.CreateAndDispatchAsync(
               request.RecipientUserId,
               userId,
               eNotificationType.DirectMessage,
               message.ConversationId.ToString(),
               ct);
          
          return Ok(message);
     }

     // Mark all messages in a conversation as read.
     [HttpPost("conversations/{conversationId:int}/read")]
     public async Task<IActionResult> MarkAsRead(int conversationId, CancellationToken ct)
     {
          int userId = RequireUserId();
          await _dmService.MarkConversationAsReadAsync(conversationId, userId, ct);
          return NoContent();
     }

     private int RequireUserId()
     {
          return _currentUser.AppUserId
               ?? throw new UnauthorizedAccessException("User is not authenticated.");
     }
}
