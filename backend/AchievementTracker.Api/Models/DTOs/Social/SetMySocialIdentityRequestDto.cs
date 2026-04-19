namespace AchievementTracker.Api.Models.DTOs.Social;

public sealed record SetMySocialIdentityRequestDto
{
     public string? Handle { get; init; }
     public string? DisplayName { get; init; }
}
