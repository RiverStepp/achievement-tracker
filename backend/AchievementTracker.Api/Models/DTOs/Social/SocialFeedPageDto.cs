namespace AchievementTracker.Api.Models.DTOs.Social;

public sealed record SocialFeedPageDto
{
     public List<SocialFeedItemDto> Items { get; init; } = [];
     public string? NextCursor { get; init; }
     public bool HasMore { get; init; }
}