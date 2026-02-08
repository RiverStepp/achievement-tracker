namespace AchievementTracker.Api.Models.DTOs.DirectMessages;

public sealed class ConversationDto
{
     public int ConversationId { get; set; }
     public List<int> ParticipantUserIds { get; set; } = [];
     public MessageDto? LastMessage { get; set; }
     public int UnreadCount { get; set; }
     public DateTime CreateDate { get; set; }
}
