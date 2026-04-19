namespace AchievementTracker.Api.Models.Options;

public sealed class ProfileOptions
{
    public const int DefaultGamesPageSize = 25;
    public const int DefaultAchievementsPageSize = 100;
    public const int DefaultLatestActivityPageSize = 25;
    public const int DefaultMaxPinnedAchievements = 10;
    public const int DefaultPinnedAchievementDisplayOrderStep = 100;

    public int GamesPageSize { get; init; } = DefaultGamesPageSize;
    public int AchievementsPageSize { get; init; } = DefaultAchievementsPageSize;
    public int AchievementsByPointsPageSize { get; init; } = DefaultAchievementsPageSize;
    public int LatestActivityPageSize { get; init; } = DefaultLatestActivityPageSize;
    public int MaxLatestActivityPageSize { get; init; } = 100;
    public int MaxPinnedAchievements { get; init; } = DefaultMaxPinnedAchievements;
    public int PinnedAchievementDisplayOrderStep { get; init; } = DefaultPinnedAchievementDisplayOrderStep;
}
