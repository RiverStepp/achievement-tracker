using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Data.Data;
using AchievementTracker.Data.Entities;
using AchievementTracker.Data.Enums;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace AchievementTracker.Api.DataAccess.Repositories;

public sealed class DirectMessageRepository(AppDbContext db) : IDirectMessageRepository
{
     private readonly AppDbContext _db = db;

    // Finds a direct conversation for the participant pair and adds a message.
    // Uses a deterministic SQL Server app lock to serialize only this participant pair.
     public async Task<DirectMessage> SendMessageToConversationAsync(int senderUserId, int recipientUserId, string content, CancellationToken ct = default)   
     {
          await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, ct);

          string lockResource = BuildDirectConversationLockKey(senderUserId, recipientUserId);
          var lockResourceParameter = new SqlParameter("@lockResource", lockResource);
          var lockTimeoutParameter = new SqlParameter("@lockTimeout", 5000);
          var lockResult = new SqlParameter("@lockResult", SqlDbType.Int) { Direction = ParameterDirection.Output };
          await _db.Database.ExecuteSqlRawAsync(
               "EXEC @lockResult = sp_getapplock @Resource = @lockResource, @LockMode = 'Exclusive', @LockOwner = 'Transaction', @LockTimeout = @lockTimeout;",
               [lockResult, lockResourceParameter, lockTimeoutParameter],
               ct);

          int lockCode = (int)(lockResult.Value ?? -999);
          if (lockCode < 0)
               throw new InvalidOperationException($"Unable to acquire direct-conversation lock. Result code: {lockCode}.");

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

          message = await _db.DirectMessages
               .Include(m => m.Sender)
               .FirstAsync(m => m.DirectMessageId == message.DirectMessageId, ct);

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
               .ThenInclude(m => m.Sender)
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
                    ParticipantPublicIds = p.Conversation.Participants.Select(x => x.AppUserPublicId).ToList(),
                    UnreadCount = p.Conversation.Messages.Count(m =>
                         m.SenderAppUserId != userId &&
                         (p.LastReadMessageId == null || m.DirectMessageId > p.LastReadMessageId.Value)),
                    CreateDate = p.Conversation.CreateDate,
                    LastMessageId = p.Conversation.Messages
                         .OrderByDescending(m => m.DirectMessageId)
                         .Select(m => (long?)m.DirectMessageId)
                         .FirstOrDefault(),
                    LastMessageSenderPublicId = p.Conversation.Messages
                         .OrderByDescending(m => m.DirectMessageId)
                         .Select(m => (Guid?)m.Sender.PublicId)
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

     public async Task<int?> GetAppUserIdByPublicIdAsync(Guid publicId, CancellationToken ct = default)
     {
          return await _db.AppUsers
               .Where(u => u.PublicId == publicId)
               .Select(u => (int?)u.AppUserId)
               .FirstOrDefaultAsync(ct);
     }

     private static string BuildDirectConversationLockKey(int userAId, int userBId)
     {
          int first = Math.Min(userAId, userBId);
          int second = Math.Max(userAId, userBId);
          return $"dm-conversation:{first}:{second}";
     }
}
