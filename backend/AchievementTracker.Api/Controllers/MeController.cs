using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AchievementTracker.Api.Models.DTOs.Social;
using AchievementTracker.Api.Services.Interfaces;
using AchievementTracker.Models.Auth;

namespace AchievementTracker.Controllers;

[ApiController]
public class MeController : ControllerBase
{
     private readonly ICurrentUser _currentUser;
     private readonly IMeService _meService;

     public MeController(ICurrentUser currentUser, IMeService meService)
     {
          _currentUser = currentUser;
          _meService = meService;
     }

     // Endpoint to return the SteamID of the user that is currently logged in. 
     [Authorize]
     [HttpGet("/me")]
     public IActionResult GetMe()
     {
          string steamId = User.FindFirst(AuthClaims.SteamId)?.Value ?? "none";
          return Ok(new { steamId });
     }

     [Authorize]
     [HttpPost("/me/social-identity")]
     public async Task<IActionResult> SetSocialIdentity([FromBody] SetMySocialIdentityRequestDto request, CancellationToken ct)
     {
          if (_currentUser.AppUserId is null)
               return Unauthorized();

          var (success, error) = await _meService.SetSocialIdentityAsync(_currentUser.AppUserId.Value, request, ct);
          if (!success)
               return BadRequest(new { error });

          return Ok();
     }
}
