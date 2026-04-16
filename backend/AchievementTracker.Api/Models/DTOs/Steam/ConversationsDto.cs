namespace AchievementTracker.Api.Models.DTOs.DirectMessages;

public sealed record ConversationDto(
    int ConversationId,
    List<Guid> ParticipantPublicIds,
    MessageDto? LastMessage,
    int UnreadCount,
    DateTime CreateDate
);
