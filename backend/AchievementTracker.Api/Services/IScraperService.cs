namespace AchievementTracker.Services;

public interface IScraperService
{
    Task<ScrapeResult> ScrapeUserAsync(string steamIdOrUsername);
    bool CancelScraping(string? processId = null);
    int GetRunningProcessCount();
}

public class ScrapeResult
{
    public bool Success { get; set; }
    public string? SteamId { get; set; }
    public string? Username { get; set; }
    public string? ErrorMessage { get; set; }
}
