using AchievementTracker.Api.Services.Interfaces;
using AchievementTracker.Models.Options;
using AchievementTracker.Models.Responses;
using AspNet.Security.OpenId.Steam;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AchievementTracker.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
     private readonly AuthSettings authSettings;
     private readonly IAuthService authService;

     public AuthController(AuthSettings authSettings, IAuthService authService)
     {
          this.authSettings = authSettings;
          this.authService = authService;
     }

     // Phase 1: start Steam auth
     [HttpGet("steam/login")]
     public IActionResult SteamLogin()
     {
          AuthenticationProperties properties = new AuthenticationProperties
          {
               RedirectUri = Url.Action(nameof(SteamCallback))
          };

          return Challenge(properties, [SteamAuthenticationDefaults.AuthenticationScheme]);
     }

     // Phase 2: Steam returns here
     [HttpGet("steam/callback")]
     public async Task<IActionResult> SteamCallback()
     {
          AuthenticateResult externalResult = await HttpContext.AuthenticateAsync(authSettings.ExternalScheme);
          if (!externalResult.Succeeded || externalResult.Principal == null) return Unauthorized();

          string? steamId =
              externalResult.Principal.FindFirst("urn:steam:id")?.Value
              ?? externalResult.Principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

          if (string.IsNullOrWhiteSpace(steamId)) return Unauthorized();

          await HttpContext.SignOutAsync(authSettings.ExternalScheme);

          AuthTokenResponse? response = await authService.IssueTokensAsync(HttpContext, steamId);
          if (response == null) return Unauthorized();

          return Ok(response);
     }

     [HttpPost("refresh")]
     public async Task<IActionResult> Refresh()
     {
          AuthTokenResponse? response = await authService.RefreshAsync(HttpContext);
          if (response == null) return Unauthorized();
          return Ok(response);
     }

     [HttpPost("logout")]
     public async Task<IActionResult> Logout()
     {
          await authService.LogoutAsync(HttpContext);
          return Ok();
     }
}
