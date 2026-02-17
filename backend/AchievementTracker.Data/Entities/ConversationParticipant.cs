using AchievementTracker.Data.Entities.Common;

namespace AchievementTracker.Data.Entities;

public class ConversationParticipant : AuditableEntity
{
     public int ConversationParticipantId { get; set; }
     public int ConversationId { get; set; }
     public int AppUserId { get; set; }
     public DateTime JoinedDate { get; set; }

     #region navigation
     public Conversation Conversation { get; set; } = null!;
     public AppUser AppUser { get; set; } = null!;
     #endregion
}
