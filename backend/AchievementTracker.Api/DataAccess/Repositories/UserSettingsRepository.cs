using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.Responses.Settings;
using AchievementTracker.Data.Data;
using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace AchievementTracker.Api.DataAccess.Repositories;

public sealed class UserSettingsRepository(AppDbContext db, ILookupRepository lookupRepository)
    : IUserSettingsRepository
{
    private readonly AppDbContext _db = db;
    private readonly ILookupRepository _lookupRepository = lookupRepository;

    public async Task<UserSettingsResponseDto?> GetSettingsAsync(int appUserId, CancellationToken ct = default)
    {
        var u = await _db.AppUsers
            .AsNoTracking()
            .Include(x => x.PronounOption)
            .Include(x => x.IanaTimeZone)
            .Include(x => x.LocationCountry)
            .Include(x => x.LocationStateRegion)
            .ThenInclude(s => s!.Country)
            .Include(x => x.LocationCity)
            .ThenInclude(c => c!.StateRegion)
            .ThenInclude(sr => sr!.Country)
            .Include(x => x.SocialLinks)
            .Where(x => x.AppUserId == appUserId)
            .FirstOrDefaultAsync(ct);

        if (u == null)
            return null;

        var lookupBatch = await _lookupRepository.GetLookupOptionsBatchAsync(ct);

        UserSettingsLocationResponseDto? location = null;
        if (u.LocationCityId.HasValue && u.LocationCity != null)
        {
            var sr = u.LocationCity.StateRegion;
            var c = sr.Country;
            location = new UserSettingsLocationResponseDto(
                c.LocationCountryId,
                c.Name,
                sr.LocationStateRegionId,
                sr.Name,
                u.LocationCity.LocationCityId,
                u.LocationCity.Name);
        }
        else if (u.LocationStateRegionId.HasValue && u.LocationStateRegion != null)
        {
            var c = u.LocationStateRegion.Country;
            location = new UserSettingsLocationResponseDto(
                c.LocationCountryId,
                c.Name,
                u.LocationStateRegion.LocationStateRegionId,
                u.LocationStateRegion.Name,
                null,
                null);
        }
        else if (u.LocationCountryId.HasValue && u.LocationCountry != null)
        {
            location = new UserSettingsLocationResponseDto(
                u.LocationCountry.LocationCountryId,
                u.LocationCountry.Name,
                null,
                null,
                null,
                null);
        }

        UserSettingsPronounResponseDto? pronouns = u.PronounOption is null
            ? null
            : new UserSettingsPronounResponseDto(
                u.PronounOption.PronounOptionId,
                u.PronounOption.Code,
                u.PronounOption.DisplayLabel);

        UserSettingsTimeZoneResponseDto? tz = u.IanaTimeZone is null
            ? null
            : new UserSettingsTimeZoneResponseDto(
                u.IanaTimeZone.IanaTimeZoneId,
                u.IanaTimeZone.IanaIdentifier,
                u.IanaTimeZone.DisplayName);

        var links = u.SocialLinks
            .Where(s => s.IsActive)
            .OrderBy(s => s.Platform)
            .Select(s => new UserSettingsSocialLinkResponseDto(s.Platform, s.LinkValue, s.IsVisible))
            .ToList();

        return new UserSettingsResponseDto(
            u.DisplayName,
            u.Handle,
            u.Bio,
            location,
            tz,
            pronouns,
            links,
            lookupBatch.Countries,
            lookupBatch.IanaTimeZones,
            lookupBatch.PronounOptions);
    }

    public Task<AppUser?> GetTrackedUserForSettingsUpdateAsync(int appUserId, CancellationToken ct = default)
    {
        return _db.AppUsers
            .Include(x => x.SocialLinks)
            .FirstOrDefaultAsync(x => x.AppUserId == appUserId, ct);
    }

    public Task<bool> CountryExistsAsync(int locationCountryId, CancellationToken ct = default)
    {
        return _db.LocationCountries.AsNoTracking().AnyAsync(c => c.LocationCountryId == locationCountryId, ct);
    }

    public Task<bool> StateRegionExistsInCountryAsync(
        int locationStateRegionId,
        int locationCountryId,
        CancellationToken ct = default)
    {
        return _db.LocationStateRegions
            .AsNoTracking()
            .AnyAsync(
                s => s.LocationStateRegionId == locationStateRegionId && s.LocationCountryId == locationCountryId,
                ct);
    }

    public Task<int?> GetCountryIdForStateRegionAsync(int locationStateRegionId, CancellationToken ct = default)
    {
        return _db.LocationStateRegions
            .AsNoTracking()
            .Where(s => s.LocationStateRegionId == locationStateRegionId)
            .Select(s => (int?)s.LocationCountryId)
            .SingleOrDefaultAsync(ct);
    }

    public Task<bool> CityExistsInStateRegionAsync(
        int locationCityId,
        int locationStateRegionId,
        CancellationToken ct = default)
    {
        return _db.LocationCities
            .AsNoTracking()
            .AnyAsync(
                c => c.LocationCityId == locationCityId && c.LocationStateRegionId == locationStateRegionId,
                ct);
    }

    public Task<bool> IanaTimeZoneExistsAsync(int ianaTimeZoneId, CancellationToken ct = default)
    {
        return _db.IanaTimeZones.AsNoTracking().AnyAsync(t => t.IanaTimeZoneId == ianaTimeZoneId, ct);
    }

    public Task<bool> PronounOptionExistsAsync(int pronounOptionId, CancellationToken ct = default)
    {
        return _db.PronounOptions.AsNoTracking().AnyAsync(p => p.PronounOptionId == pronounOptionId, ct);
    }

    public Task<bool> HandleExistsAsync(string handle, int excludingAppUserId, CancellationToken ct = default)
    {
        return _db.AppUsers
            .AnyAsync(x => x.Handle == handle && x.AppUserId != excludingAppUserId, ct);
    }

    public Task SaveChangesAsync(CancellationToken ct = default)
    {
        if (!_db.ChangeTracker.HasChanges())
            return Task.CompletedTask;

        return _db.SaveChangesAsync(ct);
    }
}
