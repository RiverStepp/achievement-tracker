using AchievementTracker.Api.Models.Responses.Settings;
using AchievementTracker.Data.Entities;

namespace AchievementTracker.Api.DataAccess.Interfaces;

public interface IUserSettingsRepository
{
    Task<UserSettingsResponseDto?> GetSettingsAsync(int appUserId, CancellationToken ct = default);

    Task<AppUser?> GetTrackedUserForSettingsUpdateAsync(int appUserId, CancellationToken ct = default);

    Task<bool> CountryExistsAsync(int locationCountryId, CancellationToken ct = default);

    Task<bool> StateRegionExistsInCountryAsync(int locationStateRegionId, int locationCountryId, CancellationToken ct = default);

    Task<int?> GetCountryIdForStateRegionAsync(int locationStateRegionId, CancellationToken ct = default);

    Task<bool> CityExistsInStateRegionAsync(int locationCityId, int locationStateRegionId, CancellationToken ct = default);

    Task<bool> IanaTimeZoneExistsAsync(int ianaTimeZoneId, CancellationToken ct = default);

    Task<bool> PronounOptionExistsAsync(int pronounOptionId, CancellationToken ct = default);

    Task<bool> HandleExistsAsync(string handle, int excludingAppUserId, CancellationToken ct = default);

    Task SaveChangesAsync(CancellationToken ct = default);
}
