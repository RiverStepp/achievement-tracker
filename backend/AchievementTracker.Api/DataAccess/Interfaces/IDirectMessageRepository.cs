using AchievementTracker.Data.Entities;

namespace AchievementTracker.Api.DataAccess.Interfaces;


// Repository interface for managing direct message data access operations
// Handles conversations and messages between users in the database
public interface IDirectMessageRepository
{
     Task<Conversation?> GetConversationBetweenUsersAsync(int userId1, int userId2, CancellationToken ct = default);
     Task<Conversation> CreateConversationAsync(int userId1, int userId2, CancellationToken ct = default);
     Task<DirectMessage> AddMessageAsync(int conversationId, int senderUserId, string content, CancellationToken ct = default);
     Task<(bool IsParticipant, List<DirectMessage> Messages)> GetMessagesAndVerifyParticipantAsync(int conversationId, int userId, int pageSize, long? beforeMessageId = null, CancellationToken ct = default);     Task<List<Conversation>> GetUserConversationsAsync(int userId, CancellationToken ct = default);
     Task<bool> MarkMessagesAsReadIfParticipantAsync(int conversationId, int readerUserId, CancellationToken ct = default);     
     Task<int> GetUnreadCountAsync(int conversationId, int userId, CancellationToken ct = default);
     Task<long?> GetLastReadMessageIdAsync(int conversationId, int userId, CancellationToken ct = default);
}
