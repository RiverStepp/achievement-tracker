namespace AchievementTracker.Api.Models.DTOs.Social;

public sealed record SocialCommentDto
{
     public int SocialPostCommentId { get; init; }
     public Guid AuthorPublicId { get; init; }
     public required string Body { get; init; }
     public DateTime CreateDate { get; init; }
     public int? ParentCommentId { get; init; }
     public List<SocialCommentDto> Replies { get; init; } = [];
}
