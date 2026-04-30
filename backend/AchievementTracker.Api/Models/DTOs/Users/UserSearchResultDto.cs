namespace AchievementTracker.Api.Models.DTOs.Users;

public sealed record UserSearchResultDto(
    Guid PublicId,
    string Handle,
    string? DisplayName,
    string? ProfileImageUrl
);
