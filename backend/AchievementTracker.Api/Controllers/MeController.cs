using AchievementTracker.Api.Models.DTOs.Leaderboard;
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
[Authorize]
public sealed class MeController(
     ICurrentUser currentUser,
     IMeService meService,
     IUserSettingsService userSettingsService,
     ILeaderboardService leaderboardService) : ControllerBase
{
     private readonly ICurrentUser _currentUser = currentUser;
     private readonly IMeService _meService = meService;
     private readonly IUserSettingsService _userSettingsService = userSettingsService;
     private readonly ILeaderboardService _leaderboardService = leaderboardService;

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

     [HttpPut("/me/settings")]
     [Consumes("application/json")]
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
               imageUploads: null,
               ct);

          if (!outcome.Success)
          {
               return outcome.FailureKind switch
               {
                    UpdateUserSettingsFailureKind.NotFound => NotFound(new { error = outcome.ErrorMessage }),
                    UpdateUserSettingsFailureKind.Conflict =>
                         Conflict(new { error = outcome.ErrorMessage }),
                    _ => BadRequest(new { error = outcome.ErrorMessage }),
               };
          }

          return Ok();
     }

     /// <summary>Multipart: optional <c>profileImage</c> and/or <c>bannerImage</c> only. Text settings use <c>PUT /me/settings</c>. At least one file is required.</summary>
     [HttpPut("/me/settings/media")]
     [Consumes("multipart/form-data")]
     [RequestFormLimits(MultipartBodyLengthLimit = 30 * 1024 * 1024)]
     [RequestSizeLimit(30 * 1024 * 1024)]
     public async Task<IActionResult> UpdateMySettingsMultipart(
          [FromForm] UpdateMySettingsMediaForm form,
          CancellationToken ct)
     {
          if (_currentUser.AppUserId is null)
               return Unauthorized();

          if (form.ProfileImage is not { Length: > 0 }
               && form.BannerImage is not { Length: > 0 })
               return BadRequest(new { error = "Provide at least one of profileImage or bannerImage." });

          MemoryStream? profileMs = null;
          MemoryStream? bannerMs = null;
          try
          {
               if (form.ProfileImage is { Length: > 0 } p)
               {
                    profileMs = new MemoryStream();
                    await p.CopyToAsync(profileMs, ct);
                    profileMs.Position = 0;
               }

               if (form.BannerImage is { Length: > 0 } b)
               {
                    bannerMs = new MemoryStream();
                    await b.CopyToAsync(bannerMs, ct);
                    bannerMs.Position = 0;
               }

               UserSettingsImageUploads? uploads = null;
               if (profileMs != null || bannerMs != null)
               {
                    uploads = new UserSettingsImageUploads { Profile = profileMs, Banner = bannerMs };
                    profileMs = null;
                    bannerMs = null;
               }

               var outcome = await _userSettingsService.UpdateSettingsAsync(
                    _currentUser.AppUserId.Value,
                    new UpdateMySettingsRequestDto(),
                    uploads,
                    ct);

               if (!outcome.Success)
               {
                    return outcome.FailureKind switch
                    {
                         UpdateUserSettingsFailureKind.NotFound => NotFound(new { error = outcome.ErrorMessage }),
                         UpdateUserSettingsFailureKind.Conflict =>
                              Conflict(new { error = outcome.ErrorMessage }),
                         _ => BadRequest(new { error = outcome.ErrorMessage }),
                    };
               }

               return Ok();
          }
          finally
          {
               if (profileMs != null)
                    await profileMs.DisposeAsync();
               if (bannerMs != null)
                    await bannerMs.DisposeAsync();
          }
     }

     [AllowAnonymous]
     [HttpGet("/me")]
     public IActionResult GetMe()
     {
          string steamId = User.FindFirst(AuthClaims.SteamId)?.Value ?? "none";
          return Ok(new { steamId });
     }

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

     [HttpGet("/me/achievements/summary")]
     [ProducesResponseType(typeof(AchievementSummaryDto), StatusCodes.Status200OK)]
     [ProducesResponseType(StatusCodes.Status404NotFound)]
     public async Task<IActionResult> GetAchievementSummary(CancellationToken ct)
     {
          if (_currentUser.AppUserId is null)
               return Unauthorized();

          AchievementSummaryDto? summary =
               await _leaderboardService.GetUserSummaryAsync(_currentUser.AppUserId.Value, ct);
          if (summary is null)
               return NotFound(new { message = "No Steam profile linked for this account." });

          return Ok(summary);
     }

     [Authorize]
     [HttpDelete("/me/pinned-achievement/{pinnedAchievementId:int}")]
     public async Task<IActionResult> UnpinAchievement(
          int pinnedAchievementId,
          CancellationToken ct)
     {
          if (_currentUser.AppUserId is null)
               return Unauthorized();

          UnpinAchievementResult outcome = await _meService.UnpinAchievementAsync(
               _currentUser.AppUserId.Value,
               pinnedAchievementId,
               ct);

          if (!outcome.Success)
               return BadRequest(new { error = outcome.ErrorMessage });

          return Ok();
     }
}
