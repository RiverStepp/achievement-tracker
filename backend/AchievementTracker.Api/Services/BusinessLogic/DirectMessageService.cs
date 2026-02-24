using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.DTOs.DirectMessages;
using AchievementTracker.Api.Services.Interfaces;

namespace AchievementTracker.Api.Services.BusinessLogic;

public sealed class DirectMessageService(IDirectMessageRepository dmRepo) : IDirectMessageService
{
     private readonly IDirectMessageRepository _dmRepo = dmRepo;

     // Sends a message by finding or creating a conversation, adding the message, and returning it as a DTO
     public async Task<MessageDto> SendMessageAsync(int senderUserId, SendMessageRequest request, CancellationToken ct = default)
     {
          if (request.RecipientUserId == senderUserId)
               throw new InvalidOperationException("Cannot send a message to yourself.");

          var conversation = await _dmRepo.GetConversationBetweenUsersAsync(senderUserId, request.RecipientUserId, ct);

          conversation ??= await _dmRepo.CreateConversationAsync(senderUserId, request.RecipientUserId, ct);

          var message = await _dmRepo.AddMessageAsync(conversation.ConversationId, senderUserId, request.Content, ct);

          return new MessageDto
          {
               DirectMessageId = message.DirectMessageId,
               ConversationId = message.ConversationId,
               SenderAppUserId = message.SenderAppUserId,
               Content = message.Content,
               SentDate = message.SentDate
          };
     }

     // Retrieves message history for a conversation after verifying the user is a participant
     public async Task<List<MessageDto>> GetMessageHistoryAsync(int conversationId, int userId, int pageSize, long? beforeMessageId = null, CancellationToken ct = default)
     {
          bool isParticipant = await _dmRepo.IsUserInConversationAsync(conversationId, userId, ct);
          if (!isParticipant)
               throw new UnauthorizedAccessException("You are not a participant in this conversation.");

          var messages = await _dmRepo.GetMessagesAsync(conversationId, pageSize, beforeMessageId, ct);

          return messages.Select(m => new MessageDto
          {
               DirectMessageId = m.DirectMessageId,
               ConversationId = m.ConversationId,
               SenderAppUserId = m.SenderAppUserId,
               Content = m.Content,
               SentDate = m.SentDate
          }).ToList();
     }

     // Gets all conversations for a user with unread counts and the most recent message for each
     public async Task<List<ConversationDto>> GetConversationsAsync(int userId, CancellationToken ct = default)
     {
          var conversations = await _dmRepo.GetUserConversationsAsync(userId, ct);

          var result = new List<ConversationDto>();
          foreach (var convo in conversations)
          {
               int unread = await _dmRepo.GetUnreadCountAsync(convo.ConversationId, userId, ct);
               var lastMsg = convo.Messages.FirstOrDefault();

               result.Add(new ConversationDto
               {
                    ConversationId = convo.ConversationId,
                    ParticipantUserIds = convo.Participants.Select(p => p.AppUserId).ToList(),
                    UnreadCount = unread,
                    CreateDate = convo.CreateDate,
                    LastMessage = lastMsg != null ? new MessageDto
                    {
                         DirectMessageId = lastMsg.DirectMessageId,
                         ConversationId = lastMsg.ConversationId,
                         SenderAppUserId = lastMsg.SenderAppUserId,
                         Content = lastMsg.Content,
                         SentDate = lastMsg.SentDate
                    } : null
               });
          }

          return result;
     }

     // Marks all messages in a conversation as read after verifying the user is a participant
     public async Task MarkConversationAsReadAsync(int conversationId, int userId, CancellationToken ct = default)
     {
          bool isParticipant = await _dmRepo.IsUserInConversationAsync(conversationId, userId, ct);
          if (!isParticipant)
               throw new UnauthorizedAccessException("You are not a participant in this conversation.");

          await _dmRepo.MarkConversationAsReadAsync(conversationId, userId, ct);
     }
}
