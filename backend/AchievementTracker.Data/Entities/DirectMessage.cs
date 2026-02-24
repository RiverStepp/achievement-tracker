namespace AchievementTracker.Data.Entities;

public sealed class DirectMessage
{
     public long DirectMessageId { get; set; }
     public int ConversationId { get; set; }
     public int SenderAppUserId { get; set; }
     public string Content { get; set; } = string.Empty;
     public DateTime SentDate { get; set; }
     public DateTime? ReadDate { get; set; }

     #region navigation
     public Conversation Conversation { get; set; } = null!;
     public AppUser Sender { get; set; } = null!;
     public ICollection<MessageEmbed> Embeds { get; set; } = [];
     #endregion
}
