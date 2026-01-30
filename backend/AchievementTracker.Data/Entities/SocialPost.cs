using AchievementTracker.Data.Entities.Common;

namespace AchievementTracker.Data.Entities;

public sealed class SocialPost: AuditableEntity
{
     public int SocialPostId { get; set; }
     public Guid PublicId { get; set; }
     public int AuthorAppUserId { get; set; }
     public string? Content { get; set; }

     #region navigation
     // author
     public AppUser AppUser { get; set; } = null!;

     public List<SocialPostAttachment> Attachments { get; set; } = [];
     public List<SocialPostComment> Comments { get; set; } = [];
     public List<SocialPostReaction> Reactions { get; set; } = [];
     #endregion
}
