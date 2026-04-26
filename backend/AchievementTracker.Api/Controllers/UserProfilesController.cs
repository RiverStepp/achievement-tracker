using AchievementTracker.Api.Models.Requests;
using AchievementTracker.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AchievementTracker.Api.Controllers;

[ApiController]
[Route("users")]
public sealed class UserProfilesController(IUserProfileService userProfileService) : ControllerBase
{
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
}
