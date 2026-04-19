using AchievementTracker.Api.Models.DTOs.DirectMessages;

namespace AchievementTracker.Api.Services.Interfaces;

public interface IDirectMessageService
{
     Task<MessageDto> SendMessageAsync(int senderUserId, SendMessageRequest request, CancellationToken ct = default);
     Task<ConversationMessageHistoryDto> GetMessageHistoryAsync(int conversationId, int userId, int pageSize, long? beforeMessageId = null, CancellationToken ct = default);
     Task<List<ConversationDto>> GetConversationsAsync(int userId, CancellationToken ct = default);
     Task<List<Guid>> MarkConversationAsReadAsync(int conversationId, int userId, CancellationToken ct = default);
     Task<Guid?> GetUserPublicIdAsync(int appUserId, CancellationToken ct = default);
}
