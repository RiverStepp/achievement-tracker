using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AchievementTracker.Models.Auth;
using AchievementTracker.Api.Models.DTOs.Leaderboard;
using AchievementTracker.Api.Services.Interfaces;

namespace AchievementTracker.Controllers;

[ApiController]
public class MeController(ILeaderboardService leaderboardService) : ControllerBase
{
     [Authorize]
     private readonly ILeaderboardService _leaderboardService = leaderboardService;

     // Endpoint to return the SteamID of the user that is currently logged in. 
     [HttpGet("/me")]
     public IActionResult GetMe()
     {
          string steamId = User.FindFirst(AuthClaims.SteamId)?.Value ?? "none";
          return Ok(new { steamId });
     }

     // Returns the current user's cached achievement summary. Returns 404 if no sync has been performed yet.
     [HttpGet("/me/achievements/summary")]
     [ProducesResponseType(typeof(AchievementSummaryDto), StatusCodes.Status200OK)]
     [ProducesResponseType(StatusCodes.Status404NotFound)]
     public async Task<IActionResult> GetAchievementSummary(CancellationToken ct)
     {
          if (!TryGetUserIds(out int appUserId, out _))
               return Unauthorized();

          AchievementSummaryDto? summary = await _leaderboardService.GetUserSummaryAsync(appUserId, ct);
          if (summary == null)
               return NotFound(new { message = "No achievement data found. Trigger a sync first." });

          return Ok(summary);
     }

     // Triggers a full sync of the current user's Steam achievements. Fetches data from the Steam Web API and updates the leaderboard cache.
     [HttpPost("/me/achievements/sync")]
     [ProducesResponseType(typeof(AchievementSummaryDto), StatusCodes.Status200OK)]
     [ProducesResponseType(StatusCodes.Status400BadRequest)]
     public async Task<IActionResult> SyncAchievements(CancellationToken ct)
     {
          if (!TryGetUserIds(out int appUserId, out long steamId64))
               return Unauthorized();

          if (steamId64 == 0)
               return BadRequest(new { message = "Steam account not linked." });

          await _leaderboardService.SyncUserAchievementsAsync(appUserId, steamId64, ct);

          AchievementSummaryDto? summary = await _leaderboardService.GetUserSummaryAsync(appUserId, ct);
          return Ok(summary);
     }

     private bool TryGetUserIds(out int appUserId, out long steamId64)
     {
          appUserId = 0;
          steamId64 = 0;

          string? appUserIdStr = User.FindFirst(AuthClaims.AppUserId)?.Value;
          string? steamIdStr = User.FindFirst(AuthClaims.SteamId)?.Value;

          if (!int.TryParse(appUserIdStr, out appUserId))
               return false;

          long.TryParse(steamIdStr, out steamId64);
          return true;
     } 
}
