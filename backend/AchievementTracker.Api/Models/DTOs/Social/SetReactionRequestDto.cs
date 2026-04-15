using AchievementTracker.Data.Enums;

namespace AchievementTracker.Api.Models.DTOs.Social;

public sealed record SetReactionRequestDto
{
     public eReactionType ReactionType { get; init; }
}
