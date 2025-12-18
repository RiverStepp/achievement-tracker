namespace AchievementTracker.Services;

public class AuthBusinessLogic : IAuthBusinessLogic
{
     public string CanonicalizeSteamId(string steamId)
     {
          return steamId;
     }
}
