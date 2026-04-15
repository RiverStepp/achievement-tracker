namespace AchievementTracker.Api.Models.DTOs.Social;

public sealed record CreateSocialCommentRequestDto
{
     public required string Body { get; init; }
     public Guid? ParentCommentPublicId { get; init; }
}
