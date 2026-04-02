using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.Responses.Settings;
using AchievementTracker.Data.Data;
using Microsoft.EntityFrameworkCore;

namespace AchievementTracker.Api.DataAccess.Repositories;

public sealed class LookupRepository(AppDbContext db) : ILookupRepository
{
    private readonly AppDbContext _db = db;

    public async Task<IReadOnlyList<LocationCountryOptionDto>> GetCountriesAsync(CancellationToken ct = default)
    {
        return await _db.LocationCountries
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new LocationCountryOptionDto(c.LocationCountryId, c.IsoAlpha2, c.Name))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<LocationStateRegionOptionDto>> GetStateRegionsByCountryIdAsync(
        int locationCountryId,
        CancellationToken ct = default)
    {
        return await _db.LocationStateRegions
            .AsNoTracking()
            .Where(s => s.LocationCountryId == locationCountryId)
            .OrderBy(s => s.Name)
            .Select(
                s => new LocationStateRegionOptionDto(
                    s.LocationStateRegionId,
                    s.LocationCountryId,
                    s.Code,
                    s.Name))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<LocationCityOptionDto>> GetCitiesByStateRegionIdAsync(
        int locationStateRegionId,
        CancellationToken ct = default)
    {
        return await _db.LocationCities
            .AsNoTracking()
            .Where(c => c.LocationStateRegionId == locationStateRegionId)
            .OrderBy(c => c.Name)
            .Select(c => new LocationCityOptionDto(c.LocationCityId, c.LocationStateRegionId, c.Name))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<IanaTimeZoneOptionDto>> GetIanaTimeZonesAsync(CancellationToken ct = default)
    {
        return await _db.IanaTimeZones
            .AsNoTracking()
            .OrderBy(t => t.DisplayName)
            .Select(t => new IanaTimeZoneOptionDto(t.IanaTimeZoneId, t.IanaIdentifier, t.DisplayName))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<PronounOptionItemDto>> GetPronounOptionsAsync(CancellationToken ct = default)
    {
        return await _db.PronounOptions
            .AsNoTracking()
            .OrderBy(p => p.Code)
            .Select(p => new PronounOptionItemDto(p.PronounOptionId, p.Code, p.DisplayLabel))
            .ToListAsync(ct);
    }
}
