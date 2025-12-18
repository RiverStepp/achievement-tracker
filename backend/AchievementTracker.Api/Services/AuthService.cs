using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AchievementTracker.Models.Options;
using AchievementTracker.Models.Responses;
using Microsoft.AspNetCore.Http;
using AchievementTracker.Models.Auth;
using Microsoft.IdentityModel.Tokens;

namespace AchievementTracker.Services;

public class AuthService : IAuthService
{
     private readonly JwtSettings jwtSettings;
     private readonly SymmetricSecurityKey jwtSigningKey;
     private readonly IRefreshTokenStore refreshTokenStore;
     private readonly IAuthBusinessLogic authBusinessLogic;

     public AuthService(
         JwtSettings jwtSettings,
         SymmetricSecurityKey jwtSigningKey,
         IRefreshTokenStore refreshTokenStore,
         IAuthBusinessLogic authBusinessLogic)
     {
          this.jwtSettings = jwtSettings;
          this.jwtSigningKey = jwtSigningKey;
          this.refreshTokenStore = refreshTokenStore;
          this.authBusinessLogic = authBusinessLogic;
     }

     public async Task<AuthTokenResponse?> IssueTokensAsync(HttpContext httpContext, string steamId)
     {
          string canonicalSteamId = authBusinessLogic.CanonicalizeSteamId(steamId);
          if (string.IsNullOrWhiteSpace(canonicalSteamId)) return null;

          await refreshTokenStore.IssueAsync(httpContext, canonicalSteamId);

          return new AuthTokenResponse
          {
               Token = MintAccessToken(canonicalSteamId),
               SteamId = canonicalSteamId
          };
     }

     public async Task<AuthTokenResponse?> RefreshAsync(HttpContext httpContext)
     {
          string? steamId = await refreshTokenStore.RotateAsync(httpContext);
          if (steamId == null) return null;

          return new AuthTokenResponse
          {
               Token = MintAccessToken(steamId),
               SteamId = steamId
          };
     }

     public async Task LogoutAsync(HttpContext httpContext)
     {
          await refreshTokenStore.RevokeAsync(httpContext);
     }

     private string MintAccessToken(string steamId)
     {
          Claim[] claims = new[]
          {
            new Claim(AuthClaims.SteamId, steamId),
            new Claim(JwtRegisteredClaimNames.Sub, steamId),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
        };

          JwtSecurityToken token = new JwtSecurityToken(
              issuer: jwtSettings.Issuer,
              audience: jwtSettings.Audience,
              claims: claims,
              expires: DateTime.UtcNow.AddMinutes(jwtSettings.AccessMinutes),
              signingCredentials: new SigningCredentials(jwtSigningKey, SecurityAlgorithms.HmacSha256));

          return new JwtSecurityTokenHandler().WriteToken(token);
     }
}
