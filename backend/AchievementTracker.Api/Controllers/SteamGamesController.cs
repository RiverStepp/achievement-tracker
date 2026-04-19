using AchievementTracker.Api.Models.Responses.GameDetails;
using AchievementTracker.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AchievementTracker.Api.Controllers;

[ApiController]
[Route("steam/games")]
public sealed class SteamGamesController(IGameDetailsService gameDetailsService) : ControllerBase
{
    private readonly IGameDetailsService _gameDetailsService = gameDetailsService;

    [AllowAnonymous]
    [HttpGet("{gameId:int}")]
    public async Task<ActionResult<GameDetailsResponse>> GetGameDetails(int gameId, CancellationToken ct)
    {
        if (gameId <= 0)
            return BadRequest();

        GameDetailsResponse? response = await _gameDetailsService.GetGameDetailsAsync(gameId, ct);
        if (response == null)
            return NotFound();

        return Ok(response);
    }
}
