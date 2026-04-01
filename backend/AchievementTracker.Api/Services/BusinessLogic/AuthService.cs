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
     IAppUserRepository appUserRepository
): IAuthService
{
     private readonly JwtSettings _jwtSettings = jwtSettings;
     private readonly SymmetricSecurityKey _jwtSigningKey = jwtSigningKey;
     private readonly IRefreshTokenStore _refreshTokenStore = refreshTokenStore;
     private readonly IAuthBusinessLogic _authBusinessLogic = authBusinessLogic;
     private readonly ISteamClient _steamClient = steamClient;
     private readonly IAppUserRepository _appUserRepository = appUserRepository;

     public async Task<AuthTokenResponse?> IssueTokensAsync(HttpContext httpContext, string steamId)
     {
          CancellationToken ct = httpContext.RequestAborted;

          string canonicalSteamId = _authBusinessLogic.CanonicalizeSteamId(steamId);
          if (string.IsNullOrWhiteSpace(canonicalSteamId)) 
               return null;

          if (!long.TryParse(canonicalSteamId, out long steamId64))
               return null;

          SteamProfileDto? profile = await _steamClient.GetProfileAsync(steamId64, ct);

          var (appUserId, publicId) = await _appUserRepository.UpsertSteamUserAsync(
               steamId64,
               canonicalSteamId,
               profile,
               ct
          );

          await _refreshTokenStore.IssueAsync(httpContext, canonicalSteamId);

          return new AuthTokenResponse
          {
               Token = MintAccessToken(canonicalSteamId, appUserId, publicId),
               SteamId = canonicalSteamId
          };
     }

     public async Task<AuthTokenResponse?> RefreshAsync(HttpContext httpContext)
     {
          CancellationToken ct = httpContext.RequestAborted;

          string? steamId = await _refreshTokenStore.RotateAsync(httpContext);
          if (steamId == null) 
               return null;

          var user = await _appUserRepository.GetAppUserBySteamIdAsync(steamId, ct);
          if (user == null)
               return null;

          return new AuthTokenResponse
          {
               Token = MintAccessToken(steamId, user.Value.AppUserId, user.Value.PublicId),
               SteamId = steamId
          };
     }

     public async Task LogoutAsync(HttpContext httpContext)
     {
          await _refreshTokenStore.RevokeAsync(httpContext);
     }

     private string MintAccessToken(string steamId, int appUserId, Guid publicId)
     {
          Claim[] claims =
          [
               new Claim(AuthClaims.SteamId, steamId),
               new Claim(AuthClaims.AppUserId, appUserId.ToString()),
               new Claim(AuthClaims.AppUserPublicId, publicId.ToString()),
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
