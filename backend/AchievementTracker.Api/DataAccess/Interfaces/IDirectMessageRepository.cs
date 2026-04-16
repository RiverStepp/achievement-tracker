using AchievementTracker.Data.Entities;

namespace AchievementTracker.Api.DataAccess.Interfaces;

// All chat messages (grouped and organzied) fetched in one request
public sealed class ConversationWithUnread
{
     public int ConversationId { get; init; }
     public List<Guid> ParticipantPublicIds { get; init; } = [];
     public int UnreadCount { get; init; }
     public DateTime CreateDate { get; init; }
     // The most recent message's details (null when the conversation has no messages yet)
     public long? LastMessageId { get; init; }
     public Guid? LastMessageSenderPublicId { get; init; }
     public string? LastMessageContent { get; init; }
     public DateTime? LastMessageSentDate { get; init; }
}

// Repository interface for managing direct message data access operations
// Handles conversations and messages between users in the database
public interface IDirectMessageRepository
{
     Task<DirectMessage> SendMessageToConversationAsync(int senderUserId, int recipientUserId, string content, CancellationToken ct = default);
     Task<(List<DirectMessage> Messages, long? LastReadMessageId)?> GetMessagesIfParticipantAsync(int conversationId, int userId, int pageSize, long? beforeMessageId, CancellationToken ct = default);
     Task<List<ConversationWithUnread>> GetUserConversationsAsync(int userId, CancellationToken ct = default);
     Task<List<Guid>?> MarkConversationAsReadAsync(int conversationId, int userId, CancellationToken ct = default);
     Task<Guid?> GetUserPublicIdAsync(int appUserId, CancellationToken ct = default);
     Task<int?> GetAppUserIdByPublicIdAsync(Guid publicId, CancellationToken ct = default);
}
