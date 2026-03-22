using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.DTOs.Leaderboard;
using AchievementTracker.Api.Services.Interfaces;

namespace AchievementTracker.Api.Services.BusinessLogic;

public sealed class LeaderboardService(
    ISteamClient steamClient,
    ILeaderboardRepository leaderboardRepository,
    ILogger<LeaderboardService> logger
) : ILeaderboardService
{
    private readonly ISteamClient _steamClient = steamClient;
    private readonly ILeaderboardRepository _leaderboardRepository = leaderboardRepository;
    private readonly ILogger<LeaderboardService> _logger = logger;

    // Syncs all Steam achievements for a given user and persists a summary to the database
    public async Task SyncUserAchievementsAsync(int appUserId, long steamId64, CancellationToken ct = default)
    {
        _logger.LogInformation("Starting achievement sync for AppUserId={AppUserId} SteamId={SteamId}", appUserId, steamId64);

        // Retrieve all games that have community stats enabled for this Steam account
        IReadOnlyList<uint> gameIds = await _steamClient.GetOwnedGamesWithStatsAsync(steamId64, ct);

        if (gameIds.Count == 0)
        {
            _logger.LogInformation(
                "No games with community stats found for SteamId={SteamId} (profile may be private or no games owned)",
                steamId64
            );
            // Store a zeroed summary so the user still appears in the repository
            await _leaderboardRepository.UpsertAchievementSummaryAsync(appUserId, 0, 0, 0, ct);
            return;
        }

        int totalAchieved = 0;
        int totalGamesTracked = 0;
        int perfectGames = 0;


        //TODO: Fix this depending on the Steam API scraper 
        // Fetch achievements per game concurrently, capped at 5 requests (Didn't know how it works when connecting it with the scrapped API data yet)
        var semaphore = new SemaphoreSlim(5, 5);
        var tasks = gameIds.Select(async appId =>
        {
            await semaphore.WaitAsync(ct);
            try
            {
                var result = await _steamClient.GetPlayerAchievementsAsync(steamId64, appId, ct);
                return (appId, result);
            }
            finally
            {
                // Always release so other tasks can proceed even if this one threw
                semaphore.Release();
            }
        });

        var results = await Task.WhenAll(tasks);

        foreach (var (appId, achievementsDto) in results)
        {
            // Skip games that returned no data or have no achievements defined
            if (achievementsDto == null || achievementsDto.Total == 0)
                continue;

            totalGamesTracked++;
            totalAchieved += achievementsDto.Achieved;

            if (achievementsDto.Achieved == achievementsDto.Total)
                perfectGames++;
        }

        _logger.LogInformation(
            "Achievement sync complete for AppUserId={AppUserId}: {TotalAchieved} unlocked across {Games} games ({Perfect} perfect)",
            appUserId, totalAchieved, totalGamesTracked, perfectGames
        );

        // Persist the aggregated summary; upsert handles both first-time inserts and updates
        await _leaderboardRepository.UpsertAchievementSummaryAsync(
            appUserId,
            totalAchieved,
            totalGamesTracked,
            perfectGames,
            ct
        );
    }

    // Returns a paginated leaderboard slice ordered by the repository's ranking logic
    public Task<LeaderboardPageDto> GetLeaderboardAsync(int page, int pageSize, CancellationToken ct = default)
        => _leaderboardRepository.GetLeaderboardPageAsync(page, pageSize, ct);

    // Returns the cached achievement summary for a single user, or null if none exists yet
    public Task<AchievementSummaryDto?> GetUserSummaryAsync(int appUserId, CancellationToken ct = default)
        => _leaderboardRepository.GetAchievementSummaryAsync(appUserId, ct);
}
