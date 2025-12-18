using System.Security.Cryptography;
using System.Text;
using AchievementTracker.Models.Options;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Distributed;

namespace AchievementTracker.Services;

public class DistributedCacheRefreshTokenStore : IRefreshTokenStore
{
     private readonly IDistributedCache distributedCache;
     private readonly AuthSettings authSettings;

     public DistributedCacheRefreshTokenStore(IDistributedCache distributedCache, AuthSettings authSettings)
     {
          this.distributedCache = distributedCache;
          this.authSettings = authSettings;
     }

     // REDIS_REQUIRED: No code changes needed—switch the IDistributedCache provider from memory to Redis to scale.
     public async Task IssueAsync(HttpContext httpContext, string steamId)
     {
          string rawToken = CreateRefreshToken();
          string cacheKey = BuildCacheKey(rawToken);

          await distributedCache.SetStringAsync(
              cacheKey,
              steamId,
              new DistributedCacheEntryOptions
              {
                   AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(authSettings.RefreshDays)
              });

          httpContext.Response.Cookies.Append(authSettings.RefreshCookieName, rawToken, BuildCookieOptions());
     }

     public async Task<string?> RotateAsync(HttpContext httpContext)
     {
          string? rawToken = GetCookieValue(httpContext, authSettings.RefreshCookieName);
          if (string.IsNullOrWhiteSpace(rawToken)) return null;

          string oldKey = BuildCacheKey(rawToken);
          string? steamId = await distributedCache.GetStringAsync(oldKey);
          if (string.IsNullOrWhiteSpace(steamId)) return null;

          await distributedCache.RemoveAsync(oldKey);

          string nextToken = CreateRefreshToken();
          string nextKey = BuildCacheKey(nextToken);

          await distributedCache.SetStringAsync(
              nextKey,
              steamId,
              new DistributedCacheEntryOptions
              {
                   AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(authSettings.RefreshDays)
              });

          httpContext.Response.Cookies.Append(authSettings.RefreshCookieName, nextToken, BuildCookieOptions());
          return steamId;
     }

     public async Task RevokeAsync(HttpContext httpContext)
     {
          string? rawToken = GetCookieValue(httpContext, authSettings.RefreshCookieName);
          if (!string.IsNullOrWhiteSpace(rawToken))
          {
               await distributedCache.RemoveAsync(BuildCacheKey(rawToken));
          }

          httpContext.Response.Cookies.Delete(authSettings.RefreshCookieName, new CookieOptions
          {
               Path = authSettings.CookiePath,
               Secure = true,
               SameSite = authSettings.CrossSiteCookies ? SameSiteMode.None : SameSiteMode.Lax
          });
     }

     private CookieOptions BuildCookieOptions()
     {
          return new CookieOptions
          {
               HttpOnly = true,
               Secure = true,
               SameSite = authSettings.CrossSiteCookies ? SameSiteMode.None : SameSiteMode.Lax,
               Path = authSettings.CookiePath,
               Expires = DateTimeOffset.UtcNow.AddDays(authSettings.RefreshDays)
          };
     }

     private static string? GetCookieValue(HttpContext httpContext, string cookieName)
     {
          bool found = httpContext.Request.Cookies.TryGetValue(cookieName, out string? value);
          return found ? value : null;
     }

     private string BuildCacheKey(string rawToken)
     {
          string tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));
          return authSettings.RefreshKeyPrefix + tokenHash;
     }

     private static string CreateRefreshToken()
     {
          byte[] bytes = RandomNumberGenerator.GetBytes(64);
          return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
     }
}
