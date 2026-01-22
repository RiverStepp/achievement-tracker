using AchievementTracker.Api.Models.DTOs.Steam;
using AchievementTracker.Api.Models.Enums;
using AchievementTracker.Api.Models.Responses.Steam;
using AchievementTracker.Api.Services.Interfaces;
using Microsoft.AspNetCore.WebUtilities;
using System.Text.Json;

namespace AchievementTracker.Api.Services.BusinessLogic;

public sealed class SteamClient(HttpClient http, IConfiguration configuration, ILogger<SteamClient> logger): ISteamClient
{
     private readonly HttpClient _http = http;
     private readonly IConfiguration _configuration = configuration;
     private readonly ILogger<SteamClient> _logger = logger;

     // Note: logins are allowed to continue even in cases where we fail to retrieve profile data because the user
     // is authenticated
     public async Task<SteamProfileDto?> GetProfileAsync(long steamId64, CancellationToken ct = default)
     {
          string? apiKey = _configuration["Authentication:Steam:ApiKey"];

          if(string.IsNullOrWhiteSpace(apiKey))
          {
               _logger.LogError("Missing secret value: Authentication:Steam:ApiKey");
               throw new InvalidOperationException("Steam API key is missing (Authentication:Steam:ApiKey)");
          }

          string path = "ISteamUser/GetPlayerSummaries/v2/";
          string url = QueryHelpers.AddQueryString(path, new Dictionary<string, string?>
          {
               ["key"] = apiKey,
               ["steamids"] = steamId64.ToString()
          });

          try
          {
               using HttpResponseMessage response = await _http.GetAsync(url, ct);

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
}
