using AchievementTracker.Api.Models.Enums;

namespace AchievementTracker.Api.Models.Options;
public sealed class SteamApiRateLimitOptions
{
     public int MinRequestIntervalMs { get; init; }
     public int MaxWaitMs { get; init; }
     public long DailyRequestLimit { get; init; }

     public int TotalQueueCapacity { get; init; }
     public int BackgroundQueueCapacity { get; init; }
     public eSteamRequestPriority BackgroundPriorityMin { get; init; }

     public string? RedisKeyPrefix { get; init; }
     public int RetryDelayMs { get; init; }
}
