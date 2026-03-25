using AchievementTracker.Api.Models.DTOs.DirectMessages;
using AchievementTracker.Api.Services.Interfaces;
using AchievementTracker.Models.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace AchievementTracker.Api.Hubs;

[Authorize]
public sealed class ChatHub(IDirectMessageService dmService) : Hub
{
     private readonly IDirectMessageService _dmService = dmService;

     private int GetAppUserId()
     {
          string? raw = Context.User?.FindFirst(AuthClaims.AppUserId)?.Value;
          if (int.TryParse(raw, out int id))
               return id;

          throw new HubException("User is not authenticated.");
     }

     public override async Task OnConnectedAsync()
     {
          int userId = GetAppUserId();
          // Add user to a personal group so we can target them by userId
          await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
          await base.OnConnectedAsync();
     }

     public override async Task OnDisconnectedAsync(Exception? exception)
     {
          await base.OnDisconnectedAsync(exception);
     }

     // Client invokes this to send a DM. The message is persisted and pushed in real time to the recipient if they are connected
     public async Task SendDirectMessage(int recipientUserId, string content)
     {
          int senderUserId = GetAppUserId();

          var request = new SendMessageRequest
          {
               RecipientUserId = recipientUserId,
               Content = content
          };

          MessageDto message = await _dmService.SendMessageAsync(senderUserId, request);

          // Send to recipient in real time
          await Clients.Group($"user-{recipientUserId}").SendAsync("ReceiveDirectMessage", message);

          // Echo back to sender so all their clients stay in sync
          await Clients.Group($"user-{senderUserId}").SendAsync("ReceiveDirectMessage", message);
     }

     // Client invokes this to mark all messages in a conversation as read
     // Notifies the other participant that their messages were read
     public async Task MarkAsRead(int conversationId)
     {
          int userId = GetAppUserId();
          await _dmService.MarkConversationAsReadAsync(conversationId, userId);

          // Notify sender their messages were read
          await Clients.Group($"user-{userId}").SendAsync("MessagesRead", conversationId);
     }
}
