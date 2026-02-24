using AchievementTracker.Data.Entities.Common;

namespace AchievementTracker.Data.Entities;

public class DirectMessage : AuditableEntity
{
     public long DirectMessageId { get; set; }
     public int ConversationId { get; set; }
     public int SenderAppUserId { get; set; }
     public required string Content { get; set; }
     public DateTime SentDate { get; set; }

     #region navigation
     public Conversation Conversation { get; set; } = null!;
     public AppUser Sender { get; set; } = null!;
     public ICollection<MessageEmbed> Embeds { get; set; } = [];
     #endregion
}
