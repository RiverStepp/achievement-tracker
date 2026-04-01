using AchievementTracker.Api.Models.Results;

namespace AchievementTracker.Api.Services.Interfaces;

public interface IProfileGatheringScriptRunner
{
     void ScheduleFirstTimeProfileGather(string canonicalSteamId);

     Task RunUpdatesOnlyAsync(string canonicalSteamId, CancellationToken ct);

     Task<ScraperInvokeResult> RunDevelopmentScrapeAsync(string steamIdOrUsername, CancellationToken ct);
}
