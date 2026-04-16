using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.DTOs.DirectMessages;
using AchievementTracker.Api.Services.Interfaces;
using AchievementTracker.Data.Entities;

namespace AchievementTracker.Api.Services.BusinessLogic;

public sealed class DirectMessageService(IDirectMessageRepository dmRepo) : IDirectMessageService
{
     private readonly IDirectMessageRepository _dmRepo = dmRepo;

     // Sends a message, finding or creating the conversation atomically in the repository layer
     public async Task<MessageDto> SendMessageAsync(int senderUserId, SendMessageRequest request, CancellationToken ct = default)
     {
          int? recipientUserId = await _dmRepo.GetAppUserIdByPublicIdAsync(request.RecipientPublicId, ct);
          if (!recipientUserId.HasValue)
               throw new InvalidOperationException("Recipient user was not found.");

          if (recipientUserId.Value == senderUserId)
               throw new InvalidOperationException("Cannot send a message to yourself.");

          var message = await _dmRepo.SendMessageToConversationAsync(senderUserId, recipientUserId.Value, request.Content, ct);

          return MapToMessageDto(message);
     }

     // Retrieves message history for a conversation after verifying the user is a participant
     public async Task<ConversationMessageHistoryDto> GetMessageHistoryAsync(int conversationId, int userId, int pageSize, long? beforeMessageId = null, CancellationToken ct = default)
     {
          var history = await _dmRepo.GetMessagesIfParticipantAsync(conversationId, userId, pageSize, beforeMessageId, ct);
          if (history is null)
               throw new UnauthorizedAccessException("You are not a participant in this conversation.");

          return new ConversationMessageHistoryDto(
               history.Value.Messages.Select(MapToMessageDto).ToList(),
               history.Value.LastReadMessageId
          );
     }

     // Gets all conversations for a user with unread counts and the most recent message for each
     public async Task<List<ConversationDto>> GetConversationsAsync(int userId, CancellationToken ct = default)
     {
          var conversations = await _dmRepo.GetUserConversationsAsync(userId, ct);

         return conversations.Select(c => new ConversationDto(
               c.ConversationId,
              c.ParticipantPublicIds,
               c.LastMessageId.HasValue ? new MessageDto(
                    c.LastMessageId.Value,
                    c.ConversationId,
                    c.LastMessageSenderPublicId!.Value,
                    c.LastMessageContent!,
                    c.LastMessageSentDate!.Value
               ) : null,
               c.UnreadCount,
               c.CreateDate
          )).ToList();
     }

     // Marks all messages in a conversation as read and returns the other participant's PublicIds
     public async Task<List<Guid>> MarkConversationAsReadAsync(int conversationId, int userId, CancellationToken ct = default)
     {
          var otherPublicIds = await _dmRepo.MarkConversationAsReadAsync(conversationId, userId, ct);
          if (otherPublicIds is null)
               throw new UnauthorizedAccessException("You are not a participant in this conversation.");

          return otherPublicIds;
     }

     public Task<Guid?> GetUserPublicIdAsync(int appUserId, CancellationToken ct = default)
          => _dmRepo.GetUserPublicIdAsync(appUserId, ct);

     private static MessageDto MapToMessageDto(DirectMessage m) => new(
          m.DirectMessageId,
          m.ConversationId,
          m.Sender.PublicId,
          m.Content,
          m.SentDate
     );
}
