using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.DTOs.Steam;
using AchievementTracker.Api.Services.Interfaces;
using AchievementTracker.Data.Entities;
using AchievementTracker.Data.Enums;
using AchievementTracker.Models.Auth;
using AchievementTracker.Models.Options;
using AchievementTracker.Models.Responses;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AchievementTracker.Api.Services.BusinessLogic;

public sealed class AuthService(
     JwtSettings jwtSettings,
     SymmetricSecurityKey jwtSigningKey,
     IRefreshTokenStore refreshTokenStore,
     IAuthBusinessLogic authBusinessLogic,
     ISteamClient steamClient,
     IAppUserRepository appUserRepository,
     IProfileGatheringScriptRunner profileGatheringScriptRunner
): IAuthService
{
     private readonly JwtSettings _jwtSettings = jwtSettings;
     private readonly SymmetricSecurityKey _jwtSigningKey = jwtSigningKey;
     private readonly IRefreshTokenStore _refreshTokenStore = refreshTokenStore;
     private readonly IAuthBusinessLogic _authBusinessLogic = authBusinessLogic;
     private readonly ISteamClient _steamClient = steamClient;
     private readonly IAppUserRepository _appUserRepository = appUserRepository;
     private readonly IProfileGatheringScriptRunner _profileGatheringScriptRunner = profileGatheringScriptRunner;

     public async Task<AuthTokenResponse?> IssueTokensAsync(HttpContext httpContext, string steamId)
     {
          CancellationToken ct = httpContext.RequestAborted;

          string canonicalSteamId = _authBusinessLogic.CanonicalizeSteamId(steamId);
          if (string.IsNullOrWhiteSpace(canonicalSteamId)) 
               return null;

          if (!long.TryParse(canonicalSteamId, out long steamId64))
               return null;

          SteamProfileDto? profile = await _steamClient.GetProfileAsync(steamId64, ct);

          var upsert = await _appUserRepository.UpsertSteamUserAsync(
               steamId64,
               canonicalSteamId,
               profile,
               ct
          );

          if (upsert.IsNewUser)
               _profileGatheringScriptRunner.ScheduleFirstTimeProfileGather(canonicalSteamId);

          await _refreshTokenStore.IssueAsync(httpContext, canonicalSteamId);

          (string? handle, string? displayName) =
               await _appUserRepository.GetHandleAndDisplayNameAsync(upsert.AppUserId, ct);

          return new AuthTokenResponse
          {
               Token = MintAccessToken(canonicalSteamId, upsert.AppUserId),
               SteamId = canonicalSteamId,
               IsNewUser = upsert.IsNewUser,
               AppUserId = upsert.AppUserId,
               Handle = handle,
               DisplayName = displayName
          };
     }

     public async Task<AuthTokenResponse?> RefreshAsync(HttpContext httpContext)
     {
          CancellationToken ct = httpContext.RequestAborted;

          string? steamId = await _refreshTokenStore.RotateAsync(httpContext);
          if (steamId == null) 
               return null;

          int? appUserId = await _appUserRepository.GetAppUserIdBySteamIdAsync(steamId, ct);
          if (appUserId == null)
               return null;

          (string? handle, string? displayName) =
               await _appUserRepository.GetHandleAndDisplayNameAsync(appUserId.Value, ct);

          return new AuthTokenResponse
          {
               Token = MintAccessToken(steamId, appUserId.Value),
               SteamId = steamId,
               IsNewUser = false,
               AppUserId = appUserId.Value,
               Handle = handle,
               DisplayName = displayName
          };
     }

     public async Task LogoutAsync(HttpContext httpContext)
     {
          await _refreshTokenStore.RevokeAsync(httpContext);
     }

     private string MintAccessToken(string steamId, int appUserId)
     {
          Claim[] claims =
          [
               new Claim(AuthClaims.SteamId, steamId),
               new Claim(AuthClaims.AppUserId, appUserId.ToString()),
               new Claim(AuthClaims.AuthProvider, eAuthProvider.Steam.ToString()),
               new Claim(AuthClaims.ProviderUserId, steamId),

               new Claim(JwtRegisteredClaimNames.Sub, steamId),
               new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
          ];

          JwtSecurityToken token = new JwtSecurityToken(
              issuer: _jwtSettings.Issuer,
              audience: _jwtSettings.Audience,
              claims: claims,
              expires: DateTime.UtcNow.AddMinutes(_jwtSettings.AccessMinutes),
              signingCredentials: new SigningCredentials(_jwtSigningKey, SecurityAlgorithms.HmacSha256));

          return new JwtSecurityTokenHandler().WriteToken(token);
     }
}
