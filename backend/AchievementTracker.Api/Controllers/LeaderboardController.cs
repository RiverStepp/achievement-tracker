using AchievementTracker.Api.Models.DTOs.Leaderboard;
using AchievementTracker.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AchievementTracker.Api.Controllers;

[ApiController]
[Route("leaderboard")]
public class LeaderboardController(ILeaderboardService leaderboardService) : ControllerBase
{
     private readonly ILeaderboardService _leaderboardService = leaderboardService;

     // Returns a paginated leaderboard ranked by total Steam achievements unlocked. Only includes users who have opted in to leaderboard visibility and have synced their achievements.
     [HttpGet]
     [ProducesResponseType(typeof(LeaderboardPageDto), StatusCodes.Status200OK)]
     public async Task<IActionResult> GetLeaderboard(
          [FromQuery] int page = 1,
          [FromQuery] int pageSize = 25,
          CancellationToken ct = default
     )
     {
          if (page < 1) page = 1;
          pageSize = Math.Clamp(pageSize, 1, 100);

          LeaderboardPageDto result = await _leaderboardService.GetLeaderboardAsync(page, pageSize, ct);
          return Ok(result);
     }
}
