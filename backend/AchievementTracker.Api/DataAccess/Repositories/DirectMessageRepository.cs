using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Data.Data;
using AchievementTracker.Data.Entities;
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

     public async Task<List<DirectMessage>> GetMessagesAsync(int conversationId, int pageSize, long? beforeMessageId = null, CancellationToken ct = default)
     {
          var query = _db.DirectMessages
               .Where(m => m.ConversationId == conversationId);

          if (beforeMessageId.HasValue)
               query = query.Where(m => m.DirectMessageId < beforeMessageId.Value);

          return await query
               .OrderByDescending(m => m.SentDate)
               .Take(pageSize)
               .OrderBy(m => m.SentDate)
               .ToListAsync(ct);
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
     public async Task MarkMessagesAsReadAsync(int conversationId, int readerUserId, CancellationToken ct = default)
     {
          await _db.DirectMessages
               .Where(m => m.ConversationId == conversationId
                    && m.SenderAppUserId != readerUserId
                    && m.ReadDate == null)
               .ExecuteUpdateAsync(s => s.SetProperty(m => m.ReadDate, DateTime.UtcNow), ct);
     }

     // Counts how many unread messages exist in a conversation for the specified user
     public async Task<int> GetUnreadCountAsync(int conversationId, int userId, CancellationToken ct = default)
     {
          return await _db.DirectMessages
               .CountAsync(m => m.ConversationId == conversationId
                    && m.SenderAppUserId != userId
                    && m.ReadDate == null, ct);
     }
}
