using AchievementTracker.Api.Models.DTOs.Steam;

namespace AchievementTracker.Api.DataAccess.Interfaces;

public interface IAppUserRepository
{
     Task<(int AppUserId, Guid PublicId)> UpsertSteamUserAsync(
          long steamId64,
          string canonicalSteamId,
          SteamProfileDto? steamProfile,
          CancellationToken ct = default
     );
     Task<(int AppUserId, Guid PublicId)?> GetAppUserBySteamIdAsync(string canonicalSteamId, CancellationToken ct = default);
     // note to self: other methods don't need to be in the interface because they are just "implementation details"
     // helps avoid clutter
}
