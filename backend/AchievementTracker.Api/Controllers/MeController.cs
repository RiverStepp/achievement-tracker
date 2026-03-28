using AchievementTracker.Api.Models.DTOs.Social;
using AchievementTracker.Api.Models.Results;
using AchievementTracker.Api.Services.Interfaces;
using AchievementTracker.Models.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AchievementTracker.Controllers;

[ApiController]
public sealed class MeController(ICurrentUser currentUser, IMeService meService) : ControllerBase
{
     private readonly ICurrentUser _currentUser = currentUser;
     private readonly IMeService _meService = meService;

     [Authorize]
     [HttpGet("/me")]
     public IActionResult GetMe()
     {
          string steamId = User.FindFirst(AuthClaims.SteamId)?.Value ?? "none";
          return Ok(new { steamId });
     }

     [Authorize]
     [HttpPost("/me/social-identity")]
     public async Task<IActionResult> SetSocialIdentity(
          [FromBody] SetMySocialIdentityRequestDto request,
          CancellationToken ct)
     {
          if (_currentUser.AppUserId is null)
               return Unauthorized();

          SetSocialIdentityResult outcome = await _meService.SetSocialIdentityAsync(
               _currentUser.AppUserId.Value,
               request,
               ct);

          if (!outcome.Success)
               return BadRequest(new { error = outcome.ErrorMessage });

          return Ok();
     }
}
