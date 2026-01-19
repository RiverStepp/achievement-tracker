using AchievementTracker.Models.Dtos;
using AchievementTracker.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AchievementTracker.Controllers;

[ApiController]
[Route("api/scraper")]
public class ScraperController : ControllerBase
{
    private readonly ILogger<ScraperController> _logger;
    private readonly IScraperService _scraperService;

    public ScraperController(ILogger<ScraperController> logger, IScraperService scraperService)
    {
        _logger = logger;
        _scraperService = scraperService;
    }

    [HttpPost("scrape")]
    public async Task<IActionResult> ScrapeUser([FromBody] ScrapeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.SteamIdOrUsername))
        {
            return BadRequest(new { error = "SteamIdOrUsername is required" });
        }

        try
        {
            _logger.LogInformation("Scrape request received for: {SteamIdOrUsername}", request.SteamIdOrUsername);

            var result = await _scraperService.ScrapeUserAsync(request.SteamIdOrUsername);

            if (result.Success)
            {
                return Ok(new
                {
                    success = true,
                    message = "User scraped successfully",
                    steamId = result.SteamId,
                    username = result.Username,
                    steamIdOrUsername = result.SteamId ?? request.SteamIdOrUsername
                });
            }
            else
            {
                _logger.LogWarning("Scraper failed for {SteamIdOrUsername}: {Error}",
                    request.SteamIdOrUsername, result.ErrorMessage);

                return StatusCode(500, new
                {
                    success = false,
                    error = result.ErrorMessage ?? "Scraping failed"
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing scrape request");
            return StatusCode(500, new { success = false, error = "Internal server error", message = ex.Message });
        }
    }

    [HttpPost("cancel")]
    [Authorize]
    public IActionResult CancelScraping([FromQuery] string? processId = null)
    {
        try
        {
            var cancelled = _scraperService.CancelScraping(processId);
            return Ok(new
            {
                success = true,
                cancelled = cancelled,
                message = cancelled ? "Scraping operation cancelled" : "No running scraping operations found"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling scraping operation");
            return StatusCode(500, new { success = false, error = "Failed to cancel scraping operation", message = ex.Message });
        }
    }

    [HttpGet("status")]
    [Authorize]
    public IActionResult GetScrapingStatus()
    {
        try
        {
            var runningCount = _scraperService.GetRunningProcessCount();
            return Ok(new
            {
                runningProcesses = runningCount,
                isRunning = runningCount > 0
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting scraping status");
            return StatusCode(500, new { success = false, error = "Failed to get scraping status", message = ex.Message });
        }
    }
}
