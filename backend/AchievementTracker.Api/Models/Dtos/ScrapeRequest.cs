namespace AchievementTracker.Models.Dtos;

public class ScrapeRequest
{
    public string SteamIdOrUsername { get; set; } = string.Empty;
    public bool UseDirectMode { get; set; } = false;
}
