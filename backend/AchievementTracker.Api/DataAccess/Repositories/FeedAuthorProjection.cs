namespace AchievementTracker.Api.DataAccess.Repositories;

internal sealed record FeedAuthorProjection
{
     public int AppUserId { get; init; }
     public Guid PublicId { get; init; }
     public string? Handle { get; init; }
     public string? DisplayName { get; init; }
     public string? AvatarUrl { get; init; }
}
