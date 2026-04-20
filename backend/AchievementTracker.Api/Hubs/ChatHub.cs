using AchievementTracker.Api.Models.DTOs.DirectMessages;
using AchievementTracker.Api.Services.Interfaces;
using AchievementTracker.Models.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Threading.RateLimiting;

namespace AchievementTracker.Api.Hubs;

[Authorize]
public sealed class ChatHub(
     IDirectMessageService dmService,
     ICurrentUser currentUser,
     ILogger<ChatHub> logger) : Hub
{
     private readonly IDirectMessageService _dmService = dmService;
     private readonly ICurrentUser _currentUser = currentUser;
     private readonly ILogger<ChatHub> _logger = logger;

     public const string SendDirectMessageMethod = "SendDirectMessage";
     public const string MarkAsReadMethod = "MarkAsRead";

     public const string ReceiveDirectMessageEvent = "ReceiveDirectMessage";
     public const string MessagesReadEvent = "MessagesRead";

     private const string UserGroupPrefix = "user-";

     private static readonly ConcurrentDictionary<Guid, SlidingWindowRateLimiter> _rateLimiters = new();
     private static readonly ConcurrentDictionary<Guid, int> _connectionCounts = new();

     public override async Task OnConnectedAsync()
     {
          Guid publicId = RequireAppUserPublicId();
          _connectionCounts.AddOrUpdate(publicId, 1, static (_, count) => count + 1);
          await Groups.AddToGroupAsync(Context.ConnectionId, UserGroupKey(publicId));
          await base.OnConnectedAsync();
     }

     public override async Task OnDisconnectedAsync(Exception? exception)
     {
          string? rawPublicId = Context.User?.FindFirst(AuthClaims.AppUserPublicId)?.Value;
          if (Guid.TryParse(rawPublicId, out Guid publicId))
               DecrementConnectionCount(publicId);

          await base.OnDisconnectedAsync(exception);
     }

     public async Task SendDirectMessage(Guid recipientPublicId, string content)
     {
          if (recipientPublicId == Guid.Empty)
               throw new HubException("recipientPublicId is required.");

          if (string.IsNullOrWhiteSpace(content) || content.Length > 2000)
               throw new HubException("Content must be between 1 and 2000 characters.");

          Guid senderPublicId = RequireAppUserPublicId();
          if (recipientPublicId == senderPublicId)
               throw new HubException("Cannot send a message to yourself.");

          if (!await TryAcquireRateLimitAsync(senderPublicId))
          {
               _logger.LogWarning("Rate limit exceeded for user {PublicId}", senderPublicId);
               throw new HubException("Rate limit exceeded. Please slow down.");
          }

          int senderUserId = RequireAppUserId();

          var request = new SendMessageRequest
          {
               RecipientPublicId = recipientPublicId,
               Content = content
          };

          CancellationToken ct = Context.ConnectionAborted;
          MessageDto message = await _dmService.SendMessageAsync(senderUserId, request, ct);

          await Clients.Group(UserGroupKey(senderPublicId)).SendAsync(ReceiveDirectMessageEvent, message, ct);

          await Clients.Group(UserGroupKey(recipientPublicId)).SendAsync(ReceiveDirectMessageEvent, message, ct);
     }

     public async Task MarkAsRead(int conversationId)
     {
          if (conversationId <= 0)
               throw new HubException("conversationId must be a positive integer.");

          int userId = RequireAppUserId();
          List<Guid> otherPublicIds;
          try
          {
               otherPublicIds = await _dmService.MarkConversationAsReadAsync(conversationId, userId);
          }
          catch (UnauthorizedAccessException ex)
          {
               _logger.LogWarning(ex, "MarkAsRead denied for conversation {ConversationId}.", conversationId);
               throw new HubException("You are not a participant in this conversation.");
          }

          CancellationToken ct = Context.ConnectionAborted;
          foreach (Guid publicId in otherPublicIds)
               await Clients.Group(UserGroupKey(publicId)).SendAsync(MessagesReadEvent, conversationId, ct);
     }

     private static string UserGroupKey(Guid publicId) => $"{UserGroupPrefix}{publicId}";

     private int RequireAppUserId()
     {
          if (_currentUser.AppUserId is int id && id > 0)
               return id;

          _logger.LogError("Missing or invalid AppUserId claim for connection {ConnectionId}.", Context.ConnectionId);
          throw new HubException("User is not authenticated.");
     }

     private Guid RequireAppUserPublicId()
     {
          if (_currentUser.AppUserPublicId is Guid id && id != Guid.Empty)
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

     private static void DecrementConnectionCount(Guid publicId)
     {
          while (true)
          {
               if (!_connectionCounts.TryGetValue(publicId, out int currentCount))
                    return;

               int nextCount = currentCount - 1;
               if (nextCount > 0)
               {
                    if (_connectionCounts.TryUpdate(publicId, nextCount, currentCount))
                         return;

                    continue;
               }

               if (!_connectionCounts.TryRemove(new KeyValuePair<Guid, int>(publicId, currentCount)))
                    continue;

               if (_rateLimiters.TryRemove(publicId, out SlidingWindowRateLimiter? limiter))
                    limiter.Dispose();

               return;
          }
     }
}
