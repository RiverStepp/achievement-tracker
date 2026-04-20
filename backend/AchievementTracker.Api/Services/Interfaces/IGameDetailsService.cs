using AchievementTracker.Api.Models.Responses.GameDetails;

namespace AchievementTracker.Api.Services.Interfaces;

public interface IGameDetailsService
{
    Task<GameDetailsResponse?> GetGameDetailsAsync(int gameId, CancellationToken ct = default);
}
