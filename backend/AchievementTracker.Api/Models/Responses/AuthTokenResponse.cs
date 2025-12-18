namespace AchievementTracker.Models.Responses;

public class AuthTokenResponse
{
     public string Token { get; set; } = string.Empty;
     public string SteamId { get; set; } = string.Empty;
}
