namespace AchievementTracker.Api.Models.DTOs.DirectMessages;

public sealed record ConversationMessageHistoryDto(
    List<MessageDto> Messages,
    long? LastReadMessageId
);
