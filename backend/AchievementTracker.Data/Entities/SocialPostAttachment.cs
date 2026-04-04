using AchievementTracker.Data.Entities.Common;
using AchievementTracker.Data.Enums;

namespace AchievementTracker.Data.Entities;

public sealed class SocialPostAttachment: AuditableEntity
{
     public int SocialPostAttachmentId { get; set; }
     public int SocialPostId { get; set; }
     public eAttachmentType AttachmentType { get; set; }
     public required string Url { get; set; }
     public string? Caption { get; set; }
     public short DisplayOrder { get; set; }

     #region navigation
     public SocialPost Post { get; set; } = null!;
     #endregion
}
