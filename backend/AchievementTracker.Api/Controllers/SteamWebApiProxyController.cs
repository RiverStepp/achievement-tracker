using AchievementTracker.Api.Models.DTOs.Steam;
using AchievementTracker.Api.Models.Enums;
using AchievementTracker.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using AchievementTracker.Api.Helpers;

namespace AchievementTracker.Api.Controllers;

[ApiController]
[Route("steam/proxy")]
public sealed class SteamWebApiProxyController(ISteamClient steamClient) : ControllerBase
{
     private readonly ISteamClient _steamClient = steamClient;

     private const eSteamRequestPriority ProxyPriority = eSteamRequestPriority.Low;

     // Query string parameters 
     private const string QSteamId = "steamid";
     private const string QAppId = "appid";
     private const string QSteamIds = "steamids";
     private const string QVanityUrl = "vanityurl";

     [HttpGet("ISteamUser/ResolveVanityURL/v0001/")]
     public async Task<IActionResult> ResolveVanityUrl(string vanityurl, CancellationToken ct)
     {
          SteamRawResponseDto result =
               await _steamClient.ResolveVanityUrlAsync(vanityurl, ProxyPriority, ct);

          return ActionResultFactory.ToContentResult(result);
     }

     [HttpGet("ISteamUser/GetPlayerSummaries/v0002/")]
     public async Task<IActionResult> GetPlayerSummaries(string steamids, CancellationToken ct)
     {
          SteamRawResponseDto result =
               await _steamClient.GetPlayerSummariesAsync(steamids, ProxyPriority, ct);

          return ActionResultFactory.ToContentResult(result);
     }

     [HttpGet("IPlayerService/GetOwnedGames/v0001/")]
     public async Task<IActionResult> GetOwnedGames(
          long steamid,
          bool include_appinfo = true,
          bool include_played_free_games = true,
          CancellationToken ct = default
     )
     {
          SteamRawResponseDto result =
               await _steamClient.GetOwnedGamesAsync(
                    steamid,
                    include_appinfo,
                    include_played_free_games,
                    ProxyPriority,
                    ct
               );

          return ActionResultFactory.ToContentResult(result);
     }

     [HttpGet("ISteamUserStats/GetPlayerAchievements/v0001/")]
     public async Task<IActionResult> GetPlayerAchievements(long steamid, int appid, CancellationToken ct)
     {
          SteamRawResponseDto result =
               await _steamClient.GetPlayerAchievementsAsync(steamid, appid, ProxyPriority, ct);

          return ActionResultFactory.ToContentResult(result);
     }

     [HttpGet("ISteamUserStats/GetUserStatsForGame/v0002/")]
     public async Task<IActionResult> GetUserStatsForGame(long steamid, int appid, CancellationToken ct)
     {
          SteamRawResponseDto result =
               await _steamClient.GetUserStatsForGameAsync(steamid, appid, ProxyPriority, ct);

          return ActionResultFactory.ToContentResult(result);
     }

     [HttpGet("ISteamUserStats/GetSchemaForGame/v0002/")]
     public async Task<IActionResult> GetSchemaForGame(int appid, CancellationToken ct)
     {
          SteamRawResponseDto result =
               await _steamClient.GetSchemaForGameAsync(appid, ProxyPriority, ct);

          return ActionResultFactory.ToContentResult(result);
     }
}
