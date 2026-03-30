using AchievementTracker.Data.Entities.Common;

namespace AchievementTracker.Data.Entities;

public class ConversationParticipant : AuditableEntity
{
     public int ConversationParticipantId { get; set; }
     public Guid AppUserPublicId { get; set; }
     public int AppUserId { get; set; }
     public DateTime JoinedDate { get; set; }
     public DateTime? LeftDate { get; set; }
     public bool IsMuted { get; set; }
     public long? LastReadMessageId { get; set; }
 

     #region navigation
     public Conversation Conversation { get; set; } = null!;
     public AppUser AppUser { get; set; } = null!;
     public DirectMessage? LastReadMessage { get; set; }
     #endregion
}
