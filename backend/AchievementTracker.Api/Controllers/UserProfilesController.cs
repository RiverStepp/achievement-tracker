using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.Requests;
using AchievementTracker.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;

namespace AchievementTracker.Api.Controllers;

[ApiController]
[Route("users")]
public sealed class UserProfilesController(IUserProfileService userProfileService, IAppUserRepository appUserRepository) : ControllerBase
{
    private static readonly Regex s_steamId17 = new(
        "^[0-9]{17}$",
        RegexOptions.CultureInvariant | RegexOptions.Compiled);

    [AllowAnonymous]
    [HttpGet("handles/{handle}/public-id")]
    public async Task<IActionResult> GetPublicIdByHandle(string handle, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(handle))
            return BadRequest();

        Guid? publicId = await userProfileService.GetPublicIdByHandleAsync(handle, ct);
        if (!publicId.HasValue)
            return NotFound();

        return Ok(new { publicId });
    }

    [AllowAnonymous]
    [HttpGet("{publicId:guid}/profile")]
    public async Task<IActionResult> GetProfile(Guid publicId, [FromQuery] GetUserProfileRequest request, CancellationToken ct)
    {
        if (publicId == Guid.Empty)
            return BadRequest();

        var response = await userProfileService.GetProfileAsync(publicId, request, ct);
        if (response == null)
            return NotFound();

        return Ok(response);
    }

    [Authorize]
    [HttpGet("search")]
    public async Task<IActionResult> SearchUsers([FromQuery] string q, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(q) || q.TrimStart('@').Trim().Length < 2)
            return BadRequest(new { error = "Query must be at least 2 characters." });

        var results = await appUserRepository.SearchByHandleAsync(q, limit: 10, ct);
        return Ok(results);
     }
    [AllowAnonymous]
    [HttpGet("steam/{steam64Id}/profile")]
    public async Task<IActionResult> GetProfileBySteamId(string steam64Id, [FromQuery] GetUserProfileRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(steam64Id) || !s_steamId17.IsMatch(steam64Id))
            return BadRequest();

        if (!long.TryParse(steam64Id, out var parsedSteamId) || parsedSteamId <= 0)
            return BadRequest();

        var response = await userProfileService.GetProfileBySteamIdAsync(parsedSteamId, request, ct);
        if (response == null)
            return NotFound();

        return Ok(response);
    }
}
