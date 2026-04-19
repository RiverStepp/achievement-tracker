using AchievementTracker.Api.Models.Responses.GameDetails;

namespace AchievementTracker.Api.DataAccess.Interfaces;

public interface IGameDetailsRepository
{
    Task<GameDetailsResponse?> GetGameDetailsAsync(
        int gameId,
        bool isAuthenticated,
        long? steamId64,
        CancellationToken ct = default);
}
