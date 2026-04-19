using AchievementTracker.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AchievementTracker.Api.Controllers;

[ApiController]
[Route("profile-scraping")]
[Authorize]
public sealed class ProfileScrapingController(
     ICurrentUser currentUser,
     IProfileGatheringScriptRunner profileGatheringScriptRunner
) : ControllerBase
{
     private readonly ICurrentUser _currentUser = currentUser;
     private readonly IProfileGatheringScriptRunner _profileGatheringScriptRunner = profileGatheringScriptRunner;

     [HttpPost("update")]
     public async Task<IActionResult> RunUpdatesOnly(CancellationToken ct)
     {
          string? steamId = _currentUser.SteamId;
          if (string.IsNullOrWhiteSpace(steamId))
               return Unauthorized();

          try
          {
               await _profileGatheringScriptRunner.RunUpdatesOnlyAsync(steamId, ct);
          }
          catch (ArgumentException)
          {
               return BadRequest();
          }
          catch (InvalidOperationException ex)
          {
               return StatusCode(StatusCodes.Status502BadGateway, new { error = ex.Message });
          }

          return NoContent();
     }
}
