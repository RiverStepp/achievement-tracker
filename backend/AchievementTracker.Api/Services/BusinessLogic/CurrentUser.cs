using AchievementTracker.Api.Services.Interfaces;
using AchievementTracker.Data.Enums;
using AchievementTracker.Models.Auth;
using System.Security.Claims;

namespace AchievementTracker.Api.Services.BusinessLogic;

public sealed class CurrentUser(IHttpContextAccessor accessor): ICurrentUser
{
     private ClaimsPrincipal? User => accessor.HttpContext?.User;
     public bool IsAuthenticated => User?.Identity?.IsAuthenticated == true;
     public int? AppUserId
     {
          get
          {
               string? raw = User?.FindFirstValue(AuthClaims.AppUserId);
               return int.TryParse(raw, out int id) ? id : null;
          }
     }
      public Guid? AppUserPublicId
     {
          get
          {
               string? raw = User?.FindFirstValue(AuthClaims.AppUserPublicId);
               return Guid.TryParse(raw, out Guid id) ? id : null;
          }
     }
     public eAuthProvider? AuthProvider
     {
          get
          {
               string? raw = User?.FindFirstValue(AuthClaims.AuthProvider);
               return Enum.TryParse<eAuthProvider>(raw, out var p) ? p : null;
          }
     }
     public string? ProviderUserId => User?.FindFirstValue(AuthClaims.ProviderUserId);
     public string? SteamId => AuthProvider == eAuthProvider.Steam ? ProviderUserId : null;
}
