using AchievementTracker.Data.Enums;

namespace AchievementTracker.Data.Entities;

public sealed class SocialPostReaction
{
     public int SocialPostId { get; set; }
     public int AppUserId { get; set; }
     public eReactionType ReactionType { get; set; }

     #region navigation
     public SocialPost Post { get; set; } = null!;
     public AppUser AppUser { get; set; } = null!;
     #endregion
}
