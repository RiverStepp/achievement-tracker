using AchievementTracker.Api.Models.DTOs.Steam;
using AchievementTracker.Api.Models.Enums;
using AchievementTracker.Api.Models.Responses.Steam;
using AchievementTracker.Api.Services.Interfaces;
using Microsoft.AspNetCore.WebUtilities;
using System.Text.Json;

namespace AchievementTracker.Api.Services.BusinessLogic;

public sealed class SteamClient(
     HttpClient http, 
     IConfiguration configuration, 
     ILogger<SteamClient> logger,
     ISteamRequestQueue steamRequestQueue
): ISteamClient
{
     private readonly HttpClient _http = http;
     private readonly IConfiguration _configuration = configuration;
     private readonly ILogger<SteamClient> _logger = logger;
     private readonly ISteamRequestQueue _steamRequestQueue = steamRequestQueue;

     // Note: logins are allowed to continue even in cases where we fail to retrieve profile data because the user
     // is authenticated
     // TODO

     private const string KeyQueryName = "key";
     private const string DefaultJsonContentType = "application/json";

     public async Task<SteamProfileDto?> GetProfileAsync(long steamId64, CancellationToken ct = default)
     {
          string apiKey = _configuration["Authentication:Steam:ApiKey"]!; // Validated already

          string path = "ISteamUser/GetPlayerSummaries/v2/";
          string url = QueryHelpers.AddQueryString(path, new Dictionary<string, string?>
          {
               ["key"] = apiKey,
               ["steamids"] = steamId64.ToString()
          });

          try
          {
               using HttpResponseMessage response = await _steamRequestQueue.EnqueueAsync(
                    async queueCt => await _http.GetAsync(url, queueCt),
                    eSteamRequestPriority.High,
                    ct
               );

               if (!response.IsSuccessStatusCode)
               {
                    _logger.LogWarning(
                         "Steam GetPlayerSummaries failed: {StatusCode} {Reason} for SteamId={SteamId}",
                         (int)response.StatusCode,
                         response.ReasonPhrase,
                         steamId64
                    );

                    if (_logger.IsEnabled(LogLevel.Debug))
                    {
                         var body = await response.Content.ReadAsStringAsync(ct);
                         _logger.LogDebug("Steam error body for SteamId={SteamId}: {Body}", steamId64, body);
                    }

                    return null;
               }

               SteamPlayerSummariesResponse? data =
                    await response.Content.ReadFromJsonAsync<SteamPlayerSummariesResponse>(cancellationToken: ct);
               
               SteamPlayerSummary? player = data?.Response?.Players?.FirstOrDefault();
               if (player == null)
                    return null;

               bool isPrivate = player.CommunityVisibilityState != eCommunityVisibilityState.Public;

               return new SteamProfileDto(
                    PersonaName: player.PersonaName,
                    ProfileUrl: player.ProfileUrl,
                    AvatarSmallUrl: player.Avatar,
                    AvatarMediumUrl: player.AvatarMedium,
                    AvatarFullUrl: player.AvatarFull,
                    IsPrivate: isPrivate
               );
          }
          catch(HttpRequestException ex)
          {
               _logger.LogWarning(ex, "Steam request failed for SteamId={SteamId}", steamId64);
               return null;
          }
          catch (JsonException ex)
          {
               _logger.LogWarning(ex, "Steam JSON parse failed for SteamId={SteamId}", steamId64);
               return null;
          }
     }

     #region proxies
     public Task<SteamRawResponseDto> ResolveVanityUrlAsync(
          string vanityurl,
          eSteamRequestPriority priority,
          CancellationToken ct
     )
     {
          var query = new Dictionary<string, string?>
          {
               [nameof(vanityurl)] = vanityurl
          };

          return GetRawAsync("ISteamUser/ResolveVanityURL/v0001/", query, priority, ct);
     }

     public Task<SteamRawResponseDto> GetPlayerSummariesAsync(
          string steamids,
          eSteamRequestPriority priority,
          CancellationToken ct
     )
     {
          var query = new Dictionary<string, string?>
          {
               [nameof(steamids)] = steamids
          };

          return GetRawAsync("ISteamUser/GetPlayerSummaries/v0002/", query, priority, ct);
     }

     public Task<SteamRawResponseDto> GetOwnedGamesAsync(
          long steamid,
          bool include_appinfo,
          bool include_played_free_games,
          eSteamRequestPriority priority,
          CancellationToken ct
     )
     {
          var query = new Dictionary<string, string?>
          {
               [nameof(steamid)] = steamid.ToString(),
               [nameof(include_appinfo)] = 
                    include_appinfo ? bool.TrueString.ToLowerInvariant() : bool.FalseString.ToLowerInvariant(),
               [nameof(include_played_free_games)] = 
                    include_played_free_games ? bool.TrueString.ToLowerInvariant() : bool.FalseString.ToLowerInvariant()
          };

          return GetRawAsync("IPlayerService/GetOwnedGames/v0001/", query, priority, ct);
     }

     public Task<SteamRawResponseDto> GetPlayerAchievementsAsync(
          long steamid,
          int appid,
          eSteamRequestPriority priority,
          CancellationToken ct
     )
     {
          var query = new Dictionary<string, string?>
          {
               [nameof(steamid)] = steamid.ToString(),
               [nameof(appid)] = appid.ToString()
          };

          return GetRawAsync("ISteamUserStats/GetPlayerAchievements/v0001/", query, priority, ct);
     }

     public Task<SteamRawResponseDto> GetUserStatsForGameAsync(
          long steamid,
          int appid,
          eSteamRequestPriority priority,
          CancellationToken ct
     )
     {
          var query = new Dictionary<string, string?>
          {
               [nameof(steamid)] = steamid.ToString(),
               [nameof(appid)] = appid.ToString()
          };

          return GetRawAsync("ISteamUserStats/GetUserStatsForGame/v0002/", query, priority, ct);
     }

     public Task<SteamRawResponseDto> GetSchemaForGameAsync(
          int appid,
          eSteamRequestPriority priority,
          CancellationToken ct
     )
     {
          var query = new Dictionary<string, string?>
          {
               [nameof(appid)] = appid.ToString()
          };

          return GetRawAsync("ISteamUserStats/GetSchemaForGame/v0002/", query, priority, ct);
     }

     #endregion

     private async Task<SteamRawResponseDto> GetRawAsync(
          string path,
          Dictionary<string, string?> query,
          eSteamRequestPriority priority,
          CancellationToken ct
     )
     {
          string apiKey = _configuration["Authentication:Steam:ApiKey"]!; // validated already in Program.cs

          query[KeyQueryName] = apiKey;

          string url = QueryHelpers.AddQueryString(path, query);

          using HttpResponseMessage response = await _steamRequestQueue.EnqueueAsync(
               async queueCt => await _http.GetAsync(url, queueCt),
               priority,
               ct
          );

          string body = await response.Content.ReadAsStringAsync(ct);
          string contentType = response.Content.Headers.ContentType?.ToString() ?? DefaultJsonContentType;

          return new SteamRawResponseDto(
               StatusCode: (int)response.StatusCode,
               ReasonPhrase: response.ReasonPhrase,
               Body: body,
               ContentType: contentType
          );
     }
}
