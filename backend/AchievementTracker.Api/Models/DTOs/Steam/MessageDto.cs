namespace AchievementTracker.Api.Models.DTOs.DirectMessages;

public sealed class MessageDto
{
     public long DirectMessageId { get; set; }
     public int ConversationId { get; set; }
     public int SenderAppUserId { get; set; }
     public string Content { get; set; } = string.Empty;
     public DateTime SentDate { get; set; }
}
