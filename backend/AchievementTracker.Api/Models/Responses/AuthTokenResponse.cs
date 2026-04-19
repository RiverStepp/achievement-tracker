namespace AchievementTracker.Models.Responses;

public class AuthTokenResponse
{
     public string Token { get; set; } = string.Empty;
     public string SteamId { get; set; } = string.Empty;
     public bool IsNewUser { get; set; }
     public Guid AppUserPublicId { get; set; }
     public string? Handle { get; set; }
     public string? DisplayName { get; set; }
}
