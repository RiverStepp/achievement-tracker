using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.Responses.Settings;
using AchievementTracker.Data.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace AchievementTracker.Api.DataAccess.Repositories;

public sealed class LookupRepository(AppDbContext db) : ILookupRepository
{
    private readonly AppDbContext _db = db;

    public async Task<LookupOptionsBatchDto> GetLookupOptionsBatchAsync(CancellationToken ct = default)
    {
        await _db.Database.OpenConnectionAsync(ct);
        try
        {
            var connection = (SqlConnection)_db.Database.GetDbConnection();
            await using var cmd = new SqlCommand(
                """
                SELECT LocationCountryId, IsoAlpha2, Name FROM dbo.LocationCountries ORDER BY Name;
                SELECT IanaTimeZoneId, IanaIdentifier, DisplayName FROM dbo.IanaTimeZones ORDER BY DisplayName;
                SELECT PronounOptionId, Code, DisplayLabel FROM dbo.PronounOptions ORDER BY Code;
                """,
                connection);

            await using var reader = await cmd.ExecuteReaderAsync(ct);

            var countries = new List<LocationCountryOptionDto>();
            while (await reader.ReadAsync(ct))
            {
                countries.Add(
                    new LocationCountryOptionDto(reader.GetInt32(0), reader.GetString(1), reader.GetString(2)));
            }

            if (!await reader.NextResultAsync(ct))
                throw new InvalidOperationException("Expected second result set for IANA time zones.");

            var timeZones = new List<IanaTimeZoneOptionDto>();
            while (await reader.ReadAsync(ct))
            {
                timeZones.Add(
                    new IanaTimeZoneOptionDto(reader.GetInt32(0), reader.GetString(1), reader.GetString(2)));
            }

            if (!await reader.NextResultAsync(ct))
                throw new InvalidOperationException("Expected third result set for pronouns.");

            var pronouns = new List<PronounOptionItemDto>();
            while (await reader.ReadAsync(ct))
            {
                pronouns.Add(
                    new PronounOptionItemDto(reader.GetInt32(0), reader.GetString(1), reader.GetString(2)));
            }

            return new LookupOptionsBatchDto(countries, timeZones, pronouns);
        }
        finally
        {
            await _db.Database.CloseConnectionAsync();
        }
    }

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
