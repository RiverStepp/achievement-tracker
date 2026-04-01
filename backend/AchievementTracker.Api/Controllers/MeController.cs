using AchievementTracker.Api.Models.DTOs.Settings;
using AchievementTracker.Api.Models.DTOs.Social;
using AchievementTracker.Api.Models.Requests;
using AchievementTracker.Api.Models.Results;
using AchievementTracker.Api.Services.Interfaces;
using AchievementTracker.Models.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AchievementTracker.Controllers;

[ApiController]
public sealed class MeController(
     ICurrentUser currentUser,
     IMeService meService,
     IUserSettingsService userSettingsService) : ControllerBase
{
     private readonly ICurrentUser _currentUser = currentUser;
     private readonly IMeService _meService = meService;
     private readonly IUserSettingsService _userSettingsService = userSettingsService;

     [Authorize]
     [HttpGet("/me/settings")]
     public async Task<IActionResult> GetMySettings(CancellationToken ct)
     {
          if (_currentUser.AppUserId is null)
               return Unauthorized();

          var settings = await _userSettingsService.GetSettingsAsync(_currentUser.AppUserId.Value, ct);
          if (settings is null)
               return NotFound();

          return Ok(settings);
     }

     [Authorize]
     [HttpPut("/me/settings")]
     public async Task<IActionResult> UpdateMySettings(
          [FromBody] UpdateMySettingsRequestDto? request,
          CancellationToken ct)
     {
          if (_currentUser.AppUserId is null)
               return Unauthorized();

          if (request is null)
               return BadRequest();

          var outcome = await _userSettingsService.UpdateSettingsAsync(
               _currentUser.AppUserId.Value,
               request,
               ct);

          if (!outcome.Success)
               return BadRequest(new { error = outcome.ErrorMessage });

          return Ok();
     }

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

     [Authorize]
     [HttpPost("/me/pin-achievement")]
     public async Task<IActionResult> PinAchievement(
          [FromBody] PinMyAchievementRequestDto? request,
          CancellationToken ct)
     {
          if (_currentUser.AppUserId is null)
               return Unauthorized();

          if (request is null)
               return BadRequest();

          PinAchievementResult outcome = await _meService.PinAchievementAsync(
               _currentUser.AppUserId.Value,
               request,
               ct);

          if (!outcome.Success)
               return BadRequest(new { error = outcome.ErrorMessage });

          return Ok();
     }

     [Authorize]
     [HttpPut("/me/pinned-achievement/{pinnedAchievementId:int}/display-order")]
     public async Task<IActionResult> UpdatePinnedAchievementDisplayOrder(
          int pinnedAchievementId,
          [FromBody] UpdatePinnedAchievementDisplayOrderRequestDto? request,
          CancellationToken ct)
     {
          if (_currentUser.AppUserId is null)
               return Unauthorized();

          if (request is null)
               return BadRequest();

          UpdatePinnedDisplayOrderResult outcome =
               await _meService.UpdatePinnedAchievementDisplayOrderAsync(
                    _currentUser.AppUserId.Value,
                    pinnedAchievementId,
                    request,
                    ct);

          if (!outcome.Success)
               return BadRequest(new { error = outcome.ErrorMessage });

          return Ok();
     }
}
