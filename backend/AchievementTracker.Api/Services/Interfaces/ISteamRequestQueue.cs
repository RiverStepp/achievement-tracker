using AchievementTracker.Api.Models.Enums;

namespace AchievementTracker.Api.Services.Interfaces;

public interface ISteamRequestQueue
{
     Task<T> EnqueueAsync<T>(Func<CancellationToken, Task<T>> work, eSteamRequestPriority priority, CancellationToken ct);
}
