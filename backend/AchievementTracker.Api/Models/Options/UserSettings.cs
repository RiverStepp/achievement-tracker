namespace AchievementTracker.Models.Options;

public class UserSettings
{
    public string DefaultAvatarUrl { get; set; } = "/default-avatar.png";
    public string DefaultPlatform { get; set; } = "steam";
    public string SteamProfileUrlTemplate { get; set; } = "https://steamcommunity.com/profiles/{0}";
    public string DefaultAchievementTitle { get; set; } = "Achievement";
    public string MostAchievementsLabel { get; set; } = "Most achievements";
    public string TopGameLabel { get; set; } = "Top game";
}
