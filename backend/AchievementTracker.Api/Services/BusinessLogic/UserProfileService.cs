using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.Options;
using AchievementTracker.Api.Models.Requests;
using AchievementTracker.Api.Models.Responses.Profile;
using AchievementTracker.Api.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace AchievementTracker.Api.Services.BusinessLogic;

public sealed class UserProfileService(
    IAppUserRepository appUserRepository,
    IUserProfileRepository userProfileRepository,
    IOptions<ProfileOptions> profileOptions) : IUserProfileService
{
    private const int MaxPageSize = 100;
    private const int MaxGamesPageSize = 100;

    public async Task<UserProfileResponse?> GetProfileAsync(Guid publicId, GetUserProfileRequest request, CancellationToken ct = default)
    {
        if (publicId == Guid.Empty)
            return null;

        var steamId = await appUserRepository.GetSteamIdByPublicIdAsync(publicId, ct);
        var normalizedRequest = NormalizeRequest(request);

        if (steamId == null)
            return await userProfileRepository.GetBasicProfileByPublicIdAsync(publicId, normalizedRequest, ct);

        return await userProfileRepository.GetProfileAsync(steamId.Value, normalizedRequest, ct);
    }

    public async Task<UserProfileResponse?> GetProfileBySteamIdAsync(long steamId, GetUserProfileRequest request, CancellationToken ct = default)
    {
        if (steamId <= 0)
            return null;

        if (!await userProfileRepository.SteamProfileExistsAsync(steamId, ct))
            return null;

        return await userProfileRepository.GetProfileAsync(steamId, NormalizeRequest(request), ct);
    }

    public Task<Guid?> GetPublicIdByHandleAsync(string handle, CancellationToken ct = default)
    {
        string normalizedHandle = handle.Trim();
        if (!normalizedHandle.StartsWith("@"))
            normalizedHandle = $"@{normalizedHandle}";

        return appUserRepository.GetPublicIdByHandleAsync(normalizedHandle, ct);
    }

    private GetUserProfileRequest NormalizeRequest(GetUserProfileRequest request)
    {
        var options = profileOptions.Value;
        var gamesPageSize =
            request.GamesPageSize > 0 ? Math.Min(request.GamesPageSize, MaxGamesPageSize) : options.GamesPageSize;
        var achievementsPageSize =
            request.AchievementsPageSize > 0 ? Math.Min(request.AchievementsPageSize, MaxPageSize) : options.AchievementsPageSize;
        var achievementsByPointsPageSize =
            request.AchievementsByPointsPageSize > 0
                ? Math.Min(request.AchievementsByPointsPageSize, MaxPageSize)
                : options.AchievementsByPointsPageSize;
        var latestActivityPageSize =
            request.LatestActivityPageSize > 0
                ? Math.Min(request.LatestActivityPageSize, options.MaxLatestActivityPageSize)
                : options.LatestActivityPageSize;

        return new GetUserProfileRequest
        {
            GamesPageNumber = Math.Max(1, request.GamesPageNumber),
            GamesPageSize = gamesPageSize,
            AchievementsPageNumber = Math.Max(1, request.AchievementsPageNumber),
            AchievementsPageSize = achievementsPageSize,
            AchievementsByPointsPageNumber = Math.Max(1, request.AchievementsByPointsPageNumber),
            AchievementsByPointsPageSize = achievementsByPointsPageSize,
            LatestActivityPageNumber = Math.Max(1, request.LatestActivityPageNumber),
            LatestActivityPageSize = latestActivityPageSize
        };
    }
}
