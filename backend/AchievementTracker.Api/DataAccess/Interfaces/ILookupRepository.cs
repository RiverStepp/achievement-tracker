using AchievementTracker.Api.Models.Responses.Settings;

namespace AchievementTracker.Api.DataAccess.Interfaces;

public interface ILookupRepository
{
    Task<IReadOnlyList<LocationCountryOptionDto>> GetCountriesAsync(CancellationToken ct = default);

    Task<IReadOnlyList<LocationStateRegionOptionDto>> GetStateRegionsByCountryIdAsync(
        int locationCountryId,
        CancellationToken ct = default);

    Task<IReadOnlyList<LocationCityOptionDto>> GetCitiesByStateRegionIdAsync(
        int locationStateRegionId,
        CancellationToken ct = default);

    Task<IReadOnlyList<IanaTimeZoneOptionDto>> GetIanaTimeZonesAsync(CancellationToken ct = default);

    Task<IReadOnlyList<PronounOptionItemDto>> GetPronounOptionsAsync(CancellationToken ct = default);
}
