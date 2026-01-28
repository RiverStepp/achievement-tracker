using AchievementTracker.Api.Models.DTOs.Steam;

namespace AchievementTracker.Api.Services.Interfaces;

public interface ISteamClient
{
     Task<SteamProfileDto?> GetProfileAsync(long steamId64, CancellationToken ct = default);
}
