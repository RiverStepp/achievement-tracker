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
        if (steamId == null)
            return null;

        var options = profileOptions.Value;
        var gamesPageSize =
            request.GamesPageSize > 0 ? Math.Min(request.GamesPageSize, MaxGamesPageSize) : options.GamesPageSize;
        var achievementsPageSize =
            request.AchievementsPageSize > 0 ? Math.Min(request.AchievementsPageSize, MaxPageSize) : options.AchievementsPageSize;
        var achievementsByPointsPageSize =
            request.AchievementsByPointsPageSize > 0 ? Math.Min(request.AchievementsByPointsPageSize, MaxPageSize) : options.AchievementsByPointsPageSize;

        var pageNumber = Math.Max(1, request.GamesPageNumber);
        var achievementsPageNumber = Math.Max(1, request.AchievementsPageNumber);
        var achievementsByPointsPageNumber = Math.Max(1, request.AchievementsByPointsPageNumber);

        var normalizedRequest = new GetUserProfileRequest
        {
            GamesPageNumber = pageNumber,
            GamesPageSize = gamesPageSize,
            AchievementsPageNumber = achievementsPageNumber,
            AchievementsPageSize = achievementsPageSize,
            AchievementsByPointsPageNumber = achievementsByPointsPageNumber,
            AchievementsByPointsPageSize = achievementsByPointsPageSize
        };

        return await userProfileRepository.GetProfileAsync(steamId.Value, normalizedRequest, ct);
    }
}
