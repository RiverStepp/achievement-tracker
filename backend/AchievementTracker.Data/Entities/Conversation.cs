using AchievementTracker.Data.Entities.Common;
using AchievementTracker.Data.Enums;

namespace AchievementTracker.Data.Entities;

public sealed class Conversation : AuditableEntity
{
     public int ConversationId { get; set; }
     public eConversationType ConversationType { get; set; }
     public string? ConversationTitle { get; set; }

     #region navigation
     public List<ConversationParticipant> Participants { get; set; } = [];
     public List<DirectMessage> Messages { get; set; } = [];
     #endregion
}
