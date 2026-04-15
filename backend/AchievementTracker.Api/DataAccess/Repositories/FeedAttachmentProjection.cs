using AchievementTracker.Data.Enums;

namespace AchievementTracker.Api.DataAccess.Repositories;

internal sealed record FeedAttachmentProjection
{
     public int SocialPostId { get; init; }
     public eAttachmentType AttachmentType { get; init; }
     public required string Url { get; init; }
     public string? Caption { get; init; }
     public short DisplayOrder { get; init; }
}
