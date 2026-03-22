namespace AchievementTracker.Api.Models.Options;

public sealed class ProfileOptions
{
    public const int DefaultGamesPageSize = 25;
    public const int DefaultAchievementsPageSize = 100;

    public int GamesPageSize { get; init; } = DefaultGamesPageSize;
    public int AchievementsPageSize { get; init; } = DefaultAchievementsPageSize;
    public int AchievementsByPointsPageSize { get; init; } = DefaultAchievementsPageSize;
}
