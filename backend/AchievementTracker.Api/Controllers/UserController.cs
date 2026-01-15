using AchievementTracker.Services;
using Microsoft.AspNetCore.Mvc;

namespace AchievementTracker.Controllers;

[ApiController]
[Route("api/users")]
public class UserController : ControllerBase
{
    private readonly ILogger<UserController> _logger;
    private readonly IUserService _userService;

    public UserController(ILogger<UserController> logger, IUserService userService)
    {
        _logger = logger;
        _userService = userService;
    }

    [HttpGet("by-steam-id/{steamId}")]
    public async Task<IActionResult> GetUserBySteamId(string steamId)
    {
        try
        {
            _logger.LogInformation("Fetching user profile for Steam ID: {SteamId}", steamId);

            var profile = await _userService.GetUserProfileBySteamIdAsync(steamId);

            if (profile == null)
            {
                return NotFound(new { error = "User not found" });
            }

            return Ok(profile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user profile for Steam ID: {SteamId}", steamId);
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpGet("by-handle/{handle}")]
    public async Task<IActionResult> GetUserByHandle(string handle)
    {
        try
        {
            _logger.LogInformation("Fetching user profile for handle: {Handle}", handle);

            // Handle can be Steam ID or username
            // Try as Steam ID first
            var profile = await _userService.GetUserProfileBySteamIdAsync(handle);

            if (profile == null)
            {
                // Could add username lookup here if needed
                return NotFound(new { error = "User not found in database" });
            }

            return Ok(profile);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Database connection failed"))
        {
            // Database connection error - return more helpful message
            _logger.LogError(ex, "Database connection error fetching user profile for handle: {Handle}", handle);
            return StatusCode(503, new { error = "Database unavailable", message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user profile for handle: {Handle}", handle);
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }
}