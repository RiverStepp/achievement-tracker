namespace AchievementTracker.Models.Options;

public class AuthSettings
{
     public string ExternalScheme { get; set; } = string.Empty;
     public string RefreshCookieName { get; set; } = string.Empty;
     public string RefreshKeyPrefix { get; set; } = string.Empty;
     public string CookiePath { get; set; } = string.Empty;
     public int RefreshDays { get; set; }
     public bool CrossSiteCookies { get; set; }
}
