using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AchievementTracker.Models.Auth;

namespace AchievementTracker.Controllers;

[ApiController]
public class MeController : ControllerBase
{
     // Endpoint to return the SteamID of the user that is currently logged in. 
     [Authorize]
     [HttpGet("/me")]
     public IActionResult GetMe()
     {
          string steamId = User.FindFirst(AuthClaims.SteamId)?.Value ?? "none";
          return Ok(new { steamId });
     }
}
