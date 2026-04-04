using AchievementTracker.Api.Models.DTOs.Scraper;
using AchievementTracker.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AchievementTracker.Api.Controllers;

/// <summary>
/// Supports scripts/src/testScraper.ts when run with IsInvokedThroughApi=1 (POST to /api/scraper/scrape).
/// Available only in the Development environment currently.
/// </summary>
[ApiController]
[Route("api/scraper")]
public sealed class ScraperController(
     IHostEnvironment hostEnvironment,
     IProfileGatheringScriptRunner profileGatheringScriptRunner
) : ControllerBase
{
     private readonly IHostEnvironment _hostEnvironment = hostEnvironment;
     private readonly IProfileGatheringScriptRunner _profileGatheringScriptRunner = profileGatheringScriptRunner;

     [HttpPost("scrape")]
     [AllowAnonymous]
     public async Task<IActionResult> Scrape([FromBody] ScraperInvokeRequestDto request, CancellationToken ct)
     {
          if (!_hostEnvironment.IsDevelopment())
               return NotFound();

          if (string.IsNullOrWhiteSpace(request.SteamIdOrUsername))
               return BadRequest(new { success = false, error = "steamIdOrUsername is required." });

          var result = await _profileGatheringScriptRunner.RunDevelopmentScrapeAsync(
               request.SteamIdOrUsername,
               ct
          );

          if (!result.Success)
               return StatusCode(StatusCodes.Status502BadGateway, new { success = false, error = result.Error });

          return Ok(new { success = true, steamId = result.SteamId });
     }
}
