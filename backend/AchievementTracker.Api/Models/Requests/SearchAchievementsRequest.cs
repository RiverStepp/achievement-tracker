using AchievementTracker.Api.Models.Options;

namespace AchievementTracker.Api.Models.Requests;

public sealed class SearchAchievementsRequest
{
    public const int MinQueryLength = 2;
    public const int MaxQueryLength = 100;
    public const int MaxPageSize = 100;

    public string Query { get; set; } = string.Empty;
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = ProfileOptions.DefaultAchievementsPageSize;
}
