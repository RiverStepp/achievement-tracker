using AchievementTracker.Data.Entities.Common;

namespace AchievementTracker.Data.Entities;

public sealed class SocialPostComment: AuditableEntity
{
     public int SocialPostCommentId { get; set; }
     public Guid PublicId { get; set; }
     public int SocialPostId { get; set; }
     public int AuthorAppUserId { get; set; }
     public required string Body { get; set; }
     public int? ParentCommentId { get; set; }

     #region navigation
     public SocialPost Post { get; set; } = null!;
     
     // Post author
     public AppUser AppUser { get; set; } = null!;

     public SocialPostComment? ParentComment { get; set; }
     public List<SocialPostComment> Replies { get; set; } = [];
     #endregion
}
