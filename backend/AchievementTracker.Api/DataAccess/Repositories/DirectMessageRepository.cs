using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Data.Data;
using AchievementTracker.Data.Entities;
using AchievementTracker.Data.Enums;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace AchievementTracker.Api.DataAccess.Repositories;

public sealed class DirectMessageRepository(AppDbContext db) : IDirectMessageRepository
{
     private readonly AppDbContext _db = db;

     // Finds a conversation where both users between two users and adds the message automatically. Uses a serializable transaction to prevent duplicate conversations under concurrent sends
     public async Task<DirectMessage> SendMessageToConversationAsync(int senderUserId, int recipientUserId, string content, CancellationToken ct = default)   
     {
          await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);

          var conversation = await _db.Conversations
               .Where(c => c.Participants.Count == 2
                    && c.Participants.Any(p => p.AppUserId == senderUserId)
                    && c.Participants.Any(p => p.AppUserId == recipientUserId))
               .FirstOrDefaultAsync(ct);

          if(conversation is null)
          {
               var senderPublicId = await _db.AppUsers
                    .Where(u => u.AppUserId == senderUserId)
                    .Select(u => u.PublicId)
                    .FirstAsync(ct);

               var recipientPublicId = await _db.AppUsers
                    .Where(u => u.AppUserId == recipientUserId)
                    .Select(u => u.PublicId)
                    .FirstAsync(ct);

               conversation = new Conversation
               {
                    ConversationType = eConversationType.Direct,
                    CreatedByAppUserId = senderUserId,
                    Participants =
                    [
                         new ConversationParticipant { AppUserId = senderUserId, AppUserPublicId = senderPublicId, JoinedDate = DateTime.UtcNow },
                         new ConversationParticipant { AppUserId = recipientUserId, AppUserPublicId = recipientPublicId, JoinedDate = DateTime.UtcNow }
                    ]
               };

               _db.Conversations.Add(conversation);
               await _db.SaveChangesAsync(ct);
          }

          var message = new DirectMessage
          {
               ConversationId = conversation.ConversationId,
               SenderAppUserId = senderUserId,
               Content = content,
               SentDate = DateTime.UtcNow
          };

          _db.DirectMessages.Add(message);
          await _db.SaveChangesAsync(ct);
          await tx.CommitAsync(ct);

          return message;
     }

     // Returns null if the user is not a participant; fetches participant membership and messages in a single DB trip
     public async Task<List<DirectMessage>?> GetMessagesIfParticipantAsync(int conversationId, int userId, int pageSize, long? beforeMessageId, CancellationToken ct = default)    
     {
           var participant = await _db.ConversationParticipants
               .Where(p => p.ConversationId == conversationId && p.AppUserId == userId)
               .Include(p => p.Conversation)
                    .ThenInclude(c => c.Messages
                         .Where(m => !beforeMessageId.HasValue || m.DirectMessageId < beforeMessageId.Value)
                         .OrderByDescending(m => m.DirectMessageId)
                         .Take(pageSize))
               .FirstOrDefaultAsync(ct);

         if (participant is null)
               return null;
               
          return [.. participant.Conversation.Messages.OrderBy(m => m.DirectMessageId)];
     }

      // Fetches all conversations for a user with per-conversation unread counts in a single query
     public async Task<List<ConversationWithUnread>> GetUserConversationsAsync(int userId, CancellationToken ct = default)
     {
          return await _db.ConversationParticipants
               .Where(p => p.AppUserId == userId)
               .Select(p => new ConversationWithUnread
               {
                    ConversationId = p.ConversationId,
                    ParticipantUserIds = p.Conversation.Participants.Select(x => x.AppUserId).ToList(),
                    UnreadCount = p.Conversation.Messages.Count(m =>
                         m.SenderAppUserId != userId &&
                         (p.LastReadMessageId == null || m.DirectMessageId > p.LastReadMessageId.Value)),
                    CreateDate = p.Conversation.CreateDate,
                    LastMessageId = p.Conversation.Messages
                         .OrderByDescending(m => m.DirectMessageId)
                         .Select(m => (long?)m.DirectMessageId)
                         .FirstOrDefault(),
                    LastMessageSenderUserId = p.Conversation.Messages
                         .OrderByDescending(m => m.DirectMessageId)
                         .Select(m => (int?)m.SenderAppUserId)
                         .FirstOrDefault(),
                    LastMessageContent = p.Conversation.Messages
                         .OrderByDescending(m => m.DirectMessageId)
                         .Select(m => m.Content)
                         .FirstOrDefault(),
                    LastMessageSentDate = p.Conversation.Messages
                         .OrderByDescending(m => m.DirectMessageId)
                         .Select(m => (DateTime?)m.SentDate)
                         .FirstOrDefault(),
               })
               .OrderByDescending(x => x.LastMessageSentDate ?? x.CreateDate)
               .ToListAsync(ct);
     }

     // Marks the conversation as read via a single UPDATE with a subquery.
     // Returns null if the user is not a participant, otherwise returns the other participant's PublicIds.
     public async Task<List<Guid>?> MarkConversationAsReadAsync(int conversationId, int userId, CancellationToken ct = default)
     {
          int rowsAffected = await _db.ConversationParticipants
               .Where(p => p.ConversationId == conversationId && p.AppUserId == userId)
               .ExecuteUpdateAsync(s => s.SetProperty(
                    p => p.LastReadMessageId,
                    p => _db.DirectMessages
                         .Where(m => m.ConversationId == conversationId)
                         .OrderByDescending(m => m.DirectMessageId)
                         .Select(m => (long?)m.DirectMessageId)
                         .FirstOrDefault()
               ), ct);

          if (rowsAffected == 0)
               return null;

           return await _db.ConversationParticipants
               .Where(p => p.ConversationId == conversationId && p.AppUserId != userId)
               .Select(p => p.AppUserPublicId)
               .ToListAsync(ct);
     }

     public async Task<Guid?> GetUserPublicIdAsync(int appUserId, CancellationToken ct = default)
     {
          return await _db.AppUsers
               .Where(u => u.AppUserId == appUserId)
               .Select(u => (Guid?)u.PublicId)
               .FirstOrDefaultAsync(ct);
     }
}
