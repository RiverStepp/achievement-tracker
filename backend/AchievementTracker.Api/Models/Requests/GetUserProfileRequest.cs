using AchievementTracker.Api.Models.Options;

namespace AchievementTracker.Api.Models.Requests;

public sealed class GetUserProfileRequest
{
    public int GamesPageNumber { get; set; } = 1;
    public int GamesPageSize { get; set; } = ProfileOptions.DefaultGamesPageSize;
    public int AchievementsPageNumber { get; set; } = 1;
    public int AchievementsPageSize { get; set; } = ProfileOptions.DefaultAchievementsPageSize;
    public int AchievementsByPointsPageNumber { get; set; } = 1;
    public int AchievementsByPointsPageSize { get; set; } = ProfileOptions.DefaultAchievementsPageSize;
    public int LatestActivityPageNumber { get; set; } = 1;
    public int LatestActivityPageSize { get; set; } = ProfileOptions.DefaultLatestActivityPageSize;
}
