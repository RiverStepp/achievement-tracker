namespace AchievementTracker.Api.Models.Responses.Profile;

public sealed record PagedResultDto<T>(
    int PageNumber,
    int PageSize,
    int TotalCount,
    IReadOnlyList<T> Items
);
