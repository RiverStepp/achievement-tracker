namespace AchievementTracker.Api.Models.DTOs.Social;

public sealed record SocialCommentPageDto
{
     public List<SocialCommentDto> Items { get; init; } = [];
     public string? NextCursor { get; init; }
     public bool HasMore { get; init; }
}
