using AchievementTracker.Models.Dtos;
using AchievementTracker.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AchievementTracker.Controllers;

[ApiController]
[Route("api/steam-api")]
[Authorize]
public class SteamApiTrackingController : ControllerBase
{
    private readonly ISteamApiTrackingService _trackingService;
    private readonly ILogger<SteamApiTrackingController> _logger;

    public SteamApiTrackingController(
        ISteamApiTrackingService trackingService,
        ILogger<SteamApiTrackingController> logger)
    {
        _trackingService = trackingService;
        _logger = logger;
    }

    /// <summary>
    /// Get overall statistics about Steam API usage
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _trackingService.GetStatsAsync();
        return Ok(stats);
    }

    /// <summary>
    /// Get recent Steam API calls
    /// </summary>
    [HttpGet("calls")]
    public async Task<IActionResult> GetRecentCalls([FromQuery] int limit = 100)
    {
        var calls = await _trackingService.GetRecentCallsAsync(limit);
        return Ok(calls);
    }

    /// <summary>
    /// Get summary statistics by endpoint
    /// </summary>
    [HttpGet("endpoints")]
    public async Task<IActionResult> GetEndpointSummaries()
    {
        var summaries = await _trackingService.GetEndpointSummariesAsync();
        return Ok(summaries);
    }

    /// <summary>
    /// Record a Steam API call (called by scripts)
    /// </summary>
    [HttpPost("record")]
    [AllowAnonymous] // Scripts need to call this without auth
    public async Task<IActionResult> RecordApiCall([FromBody] RecordApiCallRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Endpoint))
        {
            return BadRequest(new { error = "Endpoint is required" });
        }

        await _trackingService.RecordApiCallAsync(
            request.Endpoint,
            request.Method ?? "GET",
            request.StatusCode,
            request.ResponseTimeMs,
            request.RequestParams,
            request.ErrorMessage
        );

        return Ok(new { success = true });
    }

    /// <summary>
    /// Clear API call history
    /// </summary>
    [HttpDelete("history")]
    public async Task<IActionResult> ClearHistory()
    {
        await _trackingService.ClearHistoryAsync();
        return Ok(new { success = true, message = "History cleared" });
    }
}

public class RecordApiCallRequest
{
    public string Endpoint { get; set; } = string.Empty;
    public string? Method { get; set; }
    public int StatusCode { get; set; }
    public long ResponseTimeMs { get; set; }
    public Dictionary<string, string>? RequestParams { get; set; }
    public string? ErrorMessage { get; set; }
}
