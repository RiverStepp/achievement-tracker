using AchievementTracker.Api.Models.DTOs.DirectMessages;
using AchievementTracker.Api.Services.Interfaces;
using AchievementTracker.Models.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Threading.RateLimiting;

namespace AchievementTracker.Api.Hubs;

[Authorize]
public sealed class ChatHub(IDirectMessageService dmService, ILogger<ChatHub> logger) : Hub
{
     private readonly IDirectMessageService _dmService = dmService;
     private readonly ILogger<ChatHub> _logger = logger;
     
     // Client-to-server event names (for documentation purposes)
     public const string SendDirectMessageMethod = "SendDirectMessage";
     public const string MarkAsReadMethod = "MarkAsRead";

     // Server-to-client event names
     public const string ReceiveDirectMessageEvent = "ReceiveDirectMessage";
     public const string MessagesReadEvent = "MessagesRead";

     private const string UserGroupPrefix = "user-";

     // 10 messages per 10-second sliding window per user
     private static readonly ConcurrentDictionary<Guid, SlidingWindowRateLimiter> _rateLimiters = new();

     public override async Task OnConnectedAsync()
     {
          Guid publicId = GetAppUserPublicId();
          await Groups.AddToGroupAsync(Context.ConnectionId, UserGroupKey(publicId));
          await base.OnConnectedAsync();
     }

     public override async Task OnDisconnectedAsync(Exception? exception)
     {
          await base.OnDisconnectedAsync(exception);
     }

     // Client invokes this to send a DM. The message is persisted and pushed in real time to the both participants
     public async Task SendDirectMessage(int recipientUserId, string content)
     {
          if (recipientUserId <= 0)
               throw new HubException("recipientUserId must be a positive integer.");

          if (string.IsNullOrWhiteSpace(content) || content.Length > 2000)
               throw new HubException("Content must be between 1 and 2000 characters.");

          Guid senderPublicId = GetAppUserPublicId();

          if (!await TryAcquireRateLimitAsync(senderPublicId))
          {
               _logger.LogWarning("Rate limit exceeded for user {PublicId}", senderPublicId);
               throw new HubException("Rate limit exceeded. Please slow down.");
          }
          
          int senderUserId = GetAppUserId();

          var request = new SendMessageRequest
          {
               RecipientUserId = recipientUserId,
               Content = content
          };

          MessageDto message = await _dmService.SendMessageAsync(senderUserId, request);

          Guid? recipientPublicId = await _dmService.GetUserPublicIdAsync(recipientUserId);

          // Echo to sender so all their open clients stay in sync.
          await Clients.Group(UserGroupKey(senderPublicId)).SendAsync(ReceiveDirectMessageEvent, message);

          // Push to recipient if they are connected.
          if (recipientPublicId.HasValue)
               await Clients.Group(UserGroupKey(recipientPublicId.Value)).SendAsync(ReceiveDirectMessageEvent, message);
     }

     // Client invokes this to mark all messages in a conversation as read
     // Notifies the other participants so they can update their read-receipt UI
     public async Task MarkAsRead(int conversationId)
     {
          if (conversationId <= 0)
               throw new HubException("conversationId must be a positive integer.");
          
          int userId = GetAppUserId();
          List<Guid> otherPublicIds;
          try
          {
               otherPublicIds = await _dmService.MarkConversationAsReadAsync(conversationId, userId);
          }
          catch (UnauthorizedAccessException ex)
          {
               _logger.LogWarning(ex, "User {UserId} attempted MarkAsRead on conversation {ConversationId} without being a participant.", userId, conversationId);
               throw new HubException("You are not a participant in this conversation.");
          }

          foreach (Guid publicId in otherPublicIds)
               await Clients.Group(UserGroupKey(publicId)).SendAsync(MessagesReadEvent, conversationId);
     }

     private static string UserGroupKey(Guid publicId) => $"{UserGroupPrefix}{publicId}";

     private int GetAppUserId()
     {
          string? raw = Context.User?.FindFirst(AuthClaims.AppUserId)?.Value;
          if (int.TryParse(raw, out int id))
               return id;

          _logger.LogError("Missing or invalid AppUserId claim for connection {ConnectionId}.", Context.ConnectionId);
          throw new HubException("User is not authenticated.");
     }

     private Guid GetAppUserPublicId()
     {
          string? raw = Context.User?.FindFirst(AuthClaims.AppUserPublicId)?.Value;
          if (Guid.TryParse(raw, out Guid id))
               return id;

          _logger.LogError("Missing or invalid AppUserPublicId claim for connection {ConnectionId}.", Context.ConnectionId);
          throw new HubException("User is not authenticated.");
     }

     private static async ValueTask<bool> TryAcquireRateLimitAsync(Guid publicId)
     {
          var limiter = _rateLimiters.GetOrAdd(publicId, _ => new SlidingWindowRateLimiter(
               new SlidingWindowRateLimiterOptions
               {
                    Window = TimeSpan.FromSeconds(10),
                    SegmentsPerWindow = 5,
                    PermitLimit = 10,
                    QueueLimit = 0,
                    AutoReplenishment = true
               }));

          using RateLimitLease lease = await limiter.AcquireAsync(permitCount: 1);
          return lease.IsAcquired;
     }
}
