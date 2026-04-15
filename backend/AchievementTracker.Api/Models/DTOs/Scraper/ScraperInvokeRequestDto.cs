namespace AchievementTracker.Api.Models.DTOs.Scraper;

public sealed class ScraperInvokeRequestDto
{
     public string SteamIdOrUsername { get; set; } = string.Empty;

     public bool UseDirectMode { get; set; }
}
