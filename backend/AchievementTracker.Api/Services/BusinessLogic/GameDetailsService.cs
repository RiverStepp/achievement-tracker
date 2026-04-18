using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.Responses.GameDetails;
using AchievementTracker.Api.Services.Interfaces;

namespace AchievementTracker.Api.Services.BusinessLogic;

public sealed class GameDetailsService(
    ICurrentUser currentUser,
    IAppUserRepository appUserRepository,
    IGameDetailsRepository gameDetailsRepository) : IGameDetailsService
{
    private readonly ICurrentUser _currentUser = currentUser;
    private readonly IAppUserRepository _appUserRepository = appUserRepository;
    private readonly IGameDetailsRepository _gameDetailsRepository = gameDetailsRepository;

    public async Task<GameDetailsResponse?> GetGameDetailsAsync(int gameId, CancellationToken ct = default)
    {
        long? steamId64 = null;
        if (_currentUser.IsAuthenticated && _currentUser.AppUserId is int appUserId)
            steamId64 = await _appUserRepository.GetSteamId64ByAppUserIdAsync(appUserId, ct);

        return await _gameDetailsRepository.GetGameDetailsAsync(
            gameId,
            _currentUser.IsAuthenticated,
            steamId64,
            ct);
    }
}
