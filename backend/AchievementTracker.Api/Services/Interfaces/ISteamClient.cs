using AchievementTracker.Api.Models.DTOs.Steam;
using AchievementTracker.Api.Models.Enums;

namespace AchievementTracker.Api.Services.Interfaces;

public interface ISteamClient
{
     Task<SteamProfileDto?> GetProfileAsync(long steamId64, CancellationToken ct = default);
     Task<SteamRawResponseDto> ResolveVanityUrlAsync(string vanityurl, eSteamRequestPriority priority, CancellationToken ct);
     Task<SteamRawResponseDto> GetPlayerSummariesAsync(string steamids, eSteamRequestPriority priority, CancellationToken ct);
     Task<SteamRawResponseDto> GetOwnedGamesAsync(
          long steamid,
          bool include_appinfo,
          bool include_played_free_games,
          eSteamRequestPriority priority,
          CancellationToken ct
     );
     Task<SteamRawResponseDto> GetPlayerAchievementsAsync(long steamid, int appid, eSteamRequestPriority priority, CancellationToken ct);
     Task<SteamRawResponseDto> GetUserStatsForGameAsync(long steamid, int appid, eSteamRequestPriority priority, CancellationToken ct);
     Task<SteamRawResponseDto> GetSchemaForGameAsync(int appid, eSteamRequestPriority priority, CancellationToken ct);
}
