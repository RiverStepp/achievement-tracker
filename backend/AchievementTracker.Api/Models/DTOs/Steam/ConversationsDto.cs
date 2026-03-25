namespace AchievementTracker.Api.Models.DTOs.DirectMessages;

public sealed record ConversationDto(
    int ConversationId,
    List<int> ParticipantUserIds,
    MessageDto? LastMessage,
    int UnreadCount,
    DateTime CreateDate
);
