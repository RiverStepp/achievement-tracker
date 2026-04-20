using AchievementTracker.Data.Enums;

namespace AchievementTracker.Api.Models.Responses.Profile;

public sealed record ProfileLatestActivityItemDto(
    eProfileActivityType ActivityType,
    DateTime ActivityAt,
    int? GameId,
    string? GameName,
    string? AchievementName,
    string? IconUrl,
    string? Description,
    decimal? Rarity,
    int? Points,
    int? AchievementId,
    Guid? PostPublicId,
    string? PostContent,
    Guid? CommentPublicId,
    Guid? CommentPostPublicId,
    string? CommentBody
);
