namespace AchievementTracker.Api.Models.Exceptions;
public sealed class SteamDailyLimitExceededException(long dailyLimit, long currentCount)
     : Exception($"Steam daily request limit exceeded. Limit={dailyLimit}, Current={currentCount}.")
{
     public long DailyLimit { get; } = dailyLimit;
     public long CurrentCount { get; } = currentCount;
}
