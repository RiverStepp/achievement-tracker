using AchievementTracker.Api.DataAccess.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AchievementTracker.Api.Controllers;

[ApiController]
[Route("settings/lookup")]
[Authorize]
public sealed class SettingsLookupController(ILookupRepository lookupRepository) : ControllerBase
{
    private readonly ILookupRepository _lookupRepository = lookupRepository;

    [HttpGet("countries")]
    public async Task<IActionResult> GetCountries(CancellationToken ct)
    {
        var items = await _lookupRepository.GetCountriesAsync(ct);
        return Ok(items);
    }

    [HttpGet("countries/{locationCountryId:int}/state-regions")]
    public async Task<IActionResult> GetStateRegionsByCountry(int locationCountryId, CancellationToken ct)
    {
        if (locationCountryId <= 0)
            return BadRequest();

        var items = await _lookupRepository.GetStateRegionsByCountryIdAsync(locationCountryId, ct);
        return Ok(items);
    }

    [HttpGet("state-regions/{locationStateRegionId:int}/cities")]
    public async Task<IActionResult> GetCitiesByStateRegion(int locationStateRegionId, CancellationToken ct)
    {
        if (locationStateRegionId <= 0)
            return BadRequest();

        var items = await _lookupRepository.GetCitiesByStateRegionIdAsync(locationStateRegionId, ct);
        return Ok(items);
    }

    [HttpGet("iana-time-zones")]
    public async Task<IActionResult> GetIanaTimeZones(CancellationToken ct)
    {
        var items = await _lookupRepository.GetIanaTimeZonesAsync(ct);
        return Ok(items);
    }

    [HttpGet("pronouns")]
    public async Task<IActionResult> GetPronouns(CancellationToken ct)
    {
        var items = await _lookupRepository.GetPronounOptionsAsync(ct);
        return Ok(items);
    }
}
