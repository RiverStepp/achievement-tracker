using AchievementTracker.Api.Models.DTOs.DirectMessages;
using AchievementTracker.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AchievementTracker.Api.Controllers;

[ApiController]
[Route("dm")]
[Authorize]
public class DirectMessagesController(
     IDirectMessageService dmService,
     ICurrentUser currentUser) : ControllerBase
{
     private const int MinPageSize = 1;
     private const int MaxPageSize = 100;

     private readonly IDirectMessageService _dmService = dmService;
     private readonly ICurrentUser _currentUser = currentUser;

     [HttpGet("conversations")]
     public async Task<IActionResult> GetConversations(CancellationToken ct)
     {
          int userId = RequireUserId();
          var conversations = await _dmService.GetConversationsAsync(userId, ct);
          return Ok(conversations);
     }

     [HttpGet("conversations/{conversationId:int}/messages")]
     public async Task<IActionResult> GetMessages(
          int conversationId,
          [FromQuery] int pageSize = 50,
          [FromQuery] long? before = null,
          CancellationToken ct = default)
     {
          int userId = RequireUserId();

          if (pageSize is < MinPageSize or > MaxPageSize)
               return BadRequest($"pageSize must be between {MinPageSize} and {MaxPageSize}.");

          var messages = await _dmService.GetMessageHistoryAsync(conversationId, userId, pageSize, before, ct);
          return Ok(messages);
     }

     [HttpPost("send")]
     public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request, CancellationToken ct)
     {
          int userId = RequireUserId();
          var message = await _dmService.SendMessageAsync(userId, request, ct);
          return Ok(message);
     }

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
