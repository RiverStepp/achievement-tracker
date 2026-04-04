namespace AchievementTracker.Api.Models.DTOs.Social;

public sealed record SocialFeedPageDto
{
     public List<SocialFeedItemDto> Items { get; init; } = [];

     // Opaque value from the previous response; pass as the pageToken query parameter for the next page.
     public string? NextPageToken { get; init; }

     public bool HasMore { get; init; }
}