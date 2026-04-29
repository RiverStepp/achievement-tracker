using AchievementTracker.Api.Models.DTOs.Steam;
using AchievementTracker.Api.Models.DTOs.Users;
using AchievementTracker.Api.Models.Results;

namespace AchievementTracker.Api.DataAccess.Interfaces;

public interface IAppUserRepository
{
     Task<SteamUserUpsertResult> UpsertSteamUserAsync(
          long steamId64,
          string canonicalSteamId,
          SteamProfileDto? steamProfile,
          CancellationToken ct = default
     );
     Task<int?> GetAppUserIdBySteamIdAsync(string canonicalSteamId, CancellationToken ct = default);

     Task<(Guid PublicId, string? Handle, string? DisplayName)> GetPublicIdHandleAndDisplayNameAsync(
          int appUserId,
          CancellationToken ct = default);
     Task<Guid?> GetPublicIdByHandleAsync(string handle, CancellationToken ct = default);
     Task<bool> HandleExistsAsync(string handle, int? excludingAppUserId = null, CancellationToken ct = default);
     Task<bool> SetSocialIdentityAsync(int appUserId, string? handle, string? displayName, CancellationToken ct = default);
     Task<bool> HasCompleteSocialIdentityAsync(int appUserId, CancellationToken ct = default);
     Task<long?> GetSteamIdByPublicIdAsync(Guid publicId, CancellationToken ct = default);

     Task<long?> GetSteamId64ByAppUserIdAsync(int appUserId, CancellationToken ct = default);

     Task<List<UserSearchResultDto>> SearchByHandleAsync(string query, int limit = 10, CancellationToken ct = default);

     // note to self: other methods don't need to be in the interface because they are just "implementation details"
     // helps avoid clutter
}
