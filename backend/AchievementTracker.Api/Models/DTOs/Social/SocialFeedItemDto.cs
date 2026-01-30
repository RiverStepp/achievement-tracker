using AchievementTracker.Data.Enums;

namespace AchievementTracker.Api.Models.DTOs.Social;

public sealed record SocialFeedItemDto
{
     public Guid PostPublicId { get; init; }
     public Guid AuthorPublicId { get; init; }
     public DateTime CreateDate { get; init; }
     public string? Content { get; init; }
     public List<SocialPostAttachmentDto> Attachments { get; init; } = [];
     public int CommentCount { get; init; }
     public int ReactionCount { get; init; }
     public eReactionType? CurrentUserReaction { get; init; }
}
