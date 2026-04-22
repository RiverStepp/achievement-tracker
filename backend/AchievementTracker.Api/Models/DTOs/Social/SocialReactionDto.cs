using AchievementTracker.Data.Enums;

namespace AchievementTracker.Api.Models.DTOs.Social;

public sealed record SocialReactionDto
{
     public Guid AuthorPublicId { get; init; }
     public string? AuthorHandle { get; init; }
     public string? AuthorDisplayName { get; init; }
     public string? AuthorAvatarUrl { get; init; }
     public eReactionType ReactionType { get; init; }
}
