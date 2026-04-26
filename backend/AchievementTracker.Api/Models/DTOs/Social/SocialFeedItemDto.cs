using AchievementTracker.Data.Enums;

namespace AchievementTracker.Api.Models.DTOs.Social;

public sealed record SocialFeedItemDto
{
     public Guid PostPublicId { get; init; }
     public Guid AuthorPublicId { get; init; }
     public string? AuthorHandle { get; init; }
     public string? AuthorDisplayName { get; init; }
     public string? AuthorAvatarUrl { get; init; }
     public DateTime CreateDate { get; init; }
     public string? Content { get; init; }
     public List<SocialPostAttachmentDto> Attachments { get; init; } = [];
     public int CommentCount { get; init; }
     public int ReactionCount { get; init; }
     public SocialCommentDto? TopComment { get; init; }
     public DateTime? TopCommentTimestamp { get; init; }
     public eReactionType? CurrentUserReaction { get; init; }
}
