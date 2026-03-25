namespace AchievementTracker.Api.DataAccess.Interfaces;

public interface ISteamRateLimiter
{
     Task WaitForAvailabilityAsync(CancellationToken ct);
     Task<long> GetTodayCountAsync(CancellationToken ct);
}
