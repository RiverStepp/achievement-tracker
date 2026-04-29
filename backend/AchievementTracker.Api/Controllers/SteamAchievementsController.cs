using AchievementTracker.Api.Models.Requests;
using AchievementTracker.Api.Models.Responses.Profile;
using AchievementTracker.Api.Models.Responses.Steam;
using AchievementTracker.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AchievementTracker.Api.Controllers;

[ApiController]
[Route("steam/achievements")]
public sealed class SteamAchievementsController(IAchievementSearchService achievementSearchService) : ControllerBase
{
    private readonly IAchievementSearchService _achievementSearchService = achievementSearchService;

    [AllowAnonymous]
    [HttpGet("search")]
    [ProducesResponseType(typeof(PagedResultDto<AchievementSearchItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchAchievements([FromQuery] SearchAchievementsRequest request, CancellationToken ct)
    {
        string trimmedQuery = (request.Query ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(trimmedQuery))
            return BadRequest(new { error = "Query is required." });

        if (trimmedQuery.Length < SearchAchievementsRequest.MinQueryLength)
            return BadRequest(new { error = $"Query must be at least {SearchAchievementsRequest.MinQueryLength} characters." });

        if (trimmedQuery.Length > SearchAchievementsRequest.MaxQueryLength)
            return BadRequest(new { error = $"Query must be at most {SearchAchievementsRequest.MaxQueryLength} characters." });

        PagedResultDto<AchievementSearchItemDto> results = await _achievementSearchService.SearchAchievementsAsync(request, ct);
        return Ok(results);
    }
}
