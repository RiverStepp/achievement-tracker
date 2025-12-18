namespace AchievementTracker.Models.Options;

public class JwtSettings
{
     public string Issuer { get; set; } = string.Empty;
     public string Audience { get; set; } = string.Empty;
     public int AccessMinutes { get; set; }
}
