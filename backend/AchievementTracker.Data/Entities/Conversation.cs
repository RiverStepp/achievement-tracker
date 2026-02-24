using AchievementTracker.Data.Entities.Common;
using AchievementTracker.Data.Enums;

namespace AchievementTracker.Data.Entities;

public sealed class Conversation : AuditableEntity
{
     public int ConversationId { get; set; }
     public eConversationType ConversationType { get; set; }
     public string? ConversationTitle { get; set; }
     public string? ConversationImageUrl { get; set; }
     public int CreatedByAppUserId { get; set; }
     public DateTime? LastMessageDate { get; set; }

     #region navigation
     public AppUser CreatedBy { get; set; } = null!;
     public List<ConversationParticipant> Participants { get; set; } = [];
     public List<DirectMessage> Messages { get; set; } = [];
     #endregion
}
