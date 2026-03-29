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

     public async Task<(bool IsParticipant, List<DirectMessage> Messages)> GetMessagesAndVerifyParticipantAsync(int conversationId, int userId, int pageSize, long? beforeMessageId = null, CancellationToken ct = default)     {
          var result = await _db.Conversations
               .Where(c => c.ConversationId == conversationId)
               .Select(c => new
               {
                    IsParticipant = c.Participants.Any(p => p.AppUserId == userId),
                    Messages = c.Messages
                         .Where(m => beforeMessageId == null || m.DirectMessageId < beforeMessageId.Value)
                         .OrderByDescending(m => m.SentDate)
                         .Take(pageSize)
                         .ToList()
               })
               .FirstOrDefaultAsync(ct);

         if (result == null) return (false, []);
          return (result.IsParticipant, result.Messages.OrderBy(m => m.SentDate).ToList());
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
     
     // Checks if a user is a participant in the specified conversation
     public async Task<bool> IsUserInConversationAsync(int conversationId, int userId, CancellationToken ct = default)
     {
          return await _db.ConversationParticipants
               .AnyAsync(p => p.ConversationId == conversationId && p.AppUserId == userId, ct);
     }

     // Marks all unread messages in a conversation as read for the specified user
     public async Task MarkConversationAsReadAsync(int conversationId, int userId, CancellationToken ct = default)
     {
          long? latestMessageId = await _db.DirectMessages
               .Where(m => m.ConversationId == conversationId)
               .OrderByDescending(m => m.DirectMessageId)
               .Select(m => (long?)m.DirectMessageId)
               .FirstOrDefaultAsync(ct);

          if (latestMessageId is null)
               return;

          await _db.ConversationParticipants
               .Where(p => p.ConversationId == conversationId && p.AppUserId == userId)
               .ExecuteUpdateAsync(s => s.SetProperty(p => p.LastReadMessageId, latestMessageId), ct);
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
