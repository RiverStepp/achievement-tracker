using AchievementTracker.Data.Entities.Common;

namespace AchievementTracker.Data.Entities;

public sealed class Conversation : AuditableEntity
{
     public int ConversationId { get; set; }

     #region navigation
     public List<ConversationParticipant> Participants { get; set; } = [];
     public List<DirectMessage> Messages { get; set; } = [];
     #endregion
}
