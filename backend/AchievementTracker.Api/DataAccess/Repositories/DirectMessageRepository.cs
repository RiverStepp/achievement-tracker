using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Data.Data;
using AchievementTracker.Data.Entities;
using AchievementTracker.Data.Enums;
using Microsoft.EntityFrameworkCore;

namespace AchievementTracker.Api.DataAccess.Repositories;

public sealed class DirectMessageRepository(AppDbContext db) : IDirectMessageRepository
{
     private readonly AppDbContext _db = db;

     // Finds a conversation where both users are participants
     public async Task<Conversation?> GetConversationBetweenUsersAsync(int userId1, int userId2, CancellationToken ct = default)
     {
          return await _db.Conversations
               .Where(c => c.Participants.Count == 2
                    && c.Participants.Any(p => p.AppUserId == userId1)
                    && c.Participants.Any(p => p.AppUserId == userId2))
               .FirstOrDefaultAsync(ct);
     }

     // Creates a new conversation with two participants and saves it to the database
     public async Task<Conversation> CreateConversationAsync(int userId1, int userId2, CancellationToken ct = default)
     {
          var conversation = new Conversation
          {
               ConversationType = eConversationType.Direct,
               CreatedByAppUserId = userId1,
               Participants =
               [
                    new ConversationParticipant { AppUserId = userId1, JoinedDate = DateTime.UtcNow },
                    new ConversationParticipant { AppUserId = userId2, JoinedDate = DateTime.UtcNow }
               ]
          };

          _db.Conversations.Add(conversation);
          await _db.SaveChangesAsync(ct);

          return conversation;
     }

     // Creates a new message in the conversation
     public async Task<DirectMessage> AddMessageAsync(int conversationId, int senderUserId, string content, CancellationToken ct = default)
     {
          var message = new DirectMessage
          {
               ConversationId = conversationId,
               SenderAppUserId = senderUserId,
               Content = content,
               SentDate = DateTime.UtcNow
          };

          _db.DirectMessages.Add(message);
          await _db.SaveChangesAsync(ct);

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
                         .OrderByDescending(m => m.SentDate)
                         .Take(pageSize))
               .FirstOrDefaultAsync(ct);

         if (participant is null)
               return null;
               
          return [.. participant.Conversation.Messages.OrderBy(m => m.SentDate)];
     }

     // Gets all conversations for a user, including participants and the latest message, ordered by most recent activity
     public async Task<List<Conversation>> GetUserConversationsAsync(int userId, CancellationToken ct = default)
     {
          return await _db.Conversations
               .Where(c => c.Participants.Any(p => p.AppUserId == userId))
               .Include(c => c.Participants)
               .Include(c => c.Messages.OrderByDescending(m => m.SentDate).Take(1))
               .OrderByDescending(c => c.Messages.Max(m => (DateTime?)m.SentDate) ?? c.CreateDate)
               .ToListAsync(ct);
     }

     // Marks the conversation as read by setting LastReadMessageId to the latest message via a single UPDATE with a subquery. Returns false if the user is not a participant (no row updated), true otherwise
     public async Task<bool> MarkConversationAsReadAsync(int conversationId, int userId, CancellationToken ct = default)
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

          return rowsAffected > 0;
     }

     // Counts how many unread messages exist in a conversation for the specified user
     public async Task<int> GetUnreadCountAsync(int conversationId, int userId, CancellationToken ct = default)
     {
         long? lastReadId = await GetLastReadMessageIdAsync(conversationId, userId, ct);

          var query = _db.DirectMessages
               .Where(m => m.ConversationId == conversationId
                    && m.SenderAppUserId != userId);

          if (lastReadId.HasValue)
               query = query.Where(m => m.DirectMessageId > lastReadId.Value);

          return await query.CountAsync(ct);
     }

     public async Task<long?> GetLastReadMessageIdAsync(int conversationId, int userId, CancellationToken ct = default)
     {
          return await _db.ConversationParticipants
               .Where(p => p.ConversationId == conversationId && p.AppUserId == userId)
               .Select(p => p.LastReadMessageId)
               .FirstOrDefaultAsync(ct);
     }
}
