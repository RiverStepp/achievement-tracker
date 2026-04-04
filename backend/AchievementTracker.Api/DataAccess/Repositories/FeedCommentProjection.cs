namespace AchievementTracker.Api.DataAccess.Repositories;

internal sealed record FeedCommentProjection
{
     public int SocialPostId { get; init; }
     public int SocialPostCommentId { get; init; }
     public Guid CommentPublicId { get; init; }
     public Guid AuthorPublicId { get; init; }
     public string? AuthorHandle { get; init; }
     public string? AuthorDisplayName { get; init; }
     public required string Body { get; init; }
     public DateTime CreateDate { get; init; }
     public Guid? ParentCommentPublicId { get; init; }
}
