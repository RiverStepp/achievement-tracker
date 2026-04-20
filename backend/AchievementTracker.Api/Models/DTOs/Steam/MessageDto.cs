namespace AchievementTracker.Api.Models.DTOs.DirectMessages;

public sealed record MessageDto(
    long DirectMessageId,
    int ConversationId,
    Guid SenderPublicId,
    string Content,
    DateTime SentDate
);
