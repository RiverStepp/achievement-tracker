using AchievementTracker.Data.Enums;

namespace AchievementTracker.Api.DataAccess.Repositories;

internal sealed record FeedReactionProjection
{
     public int SocialPostId { get; init; }
     public int AppUserId { get; init; }
     public eReactionType ReactionType { get; init; }
}
