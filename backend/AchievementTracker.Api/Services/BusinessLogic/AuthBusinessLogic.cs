using AchievementTracker.Api.Services.Interfaces;

namespace AchievementTracker.Api.Services.BusinessLogic;

public class AuthBusinessLogic : IAuthBusinessLogic
{
     public string CanonicalizeSteamId(string steamId)
     {
          if (string.IsNullOrWhiteSpace(steamId))
               return string.Empty;

          steamId = steamId.Trim();

          // Steam sometimes gives OpenID identity URL instead of raw SteamID64
          // Example: https://steamcommunity.com/openid/id/7656119
          steamId = steamId.TrimEnd('/');

          int lastSlash = steamId.LastIndexOf('/');
          if (lastSlash >= 0)
               steamId = steamId[(lastSlash + 1)..];

          return long.TryParse(steamId, out _) ? steamId : string.Empty;
     }
}
