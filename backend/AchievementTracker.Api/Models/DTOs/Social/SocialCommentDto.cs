namespace AchievementTracker.Api.Models.DTOs.Social;

public sealed record SocialCommentDto
{
     public Guid CommentPublicId { get; init; }
     public Guid AuthorPublicId { get; init; }
     public string? AuthorHandle { get; init; }
     public string? AuthorDisplayName { get; init; }
     public string? AuthorAvatarUrl { get; init; }
     public required string Body { get; init; }
     public DateTime CreateDate { get; init; }
     public Guid? ParentCommentPublicId { get; init; }
     public List<SocialCommentDto> Replies { get; init; } = [];
}
