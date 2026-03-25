namespace AchievementTracker.Api.Models.DTOs.DirectMessages;

public sealed record MessageDto(
    long DirectMessageId,
    int ConversationId,
    int SenderAppUserId,
    string Content,
    DateTime SentDate
);
