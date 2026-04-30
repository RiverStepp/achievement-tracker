namespace AchievementTracker.Api.Models.DTOs.DirectMessages;

public sealed record ConversationParticipantDto(
    Guid PublicId,
    string? Handle,
    string? DisplayName,
    string? ProfileImageUrl
);

public sealed record ConversationDto(
    int ConversationId,
    List<Guid> ParticipantPublicIds,
    List<ConversationParticipantDto> Participants,
    MessageDto? LastMessage,
    int UnreadCount,
    DateTime CreateDate
);
