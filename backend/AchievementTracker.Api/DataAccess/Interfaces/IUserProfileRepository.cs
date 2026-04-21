using AchievementTracker.Api.Models.Requests;
using AchievementTracker.Api.Models.Responses.Profile;

namespace AchievementTracker.Api.DataAccess.Interfaces;

public interface IUserProfileRepository
{
    Task<UserProfileResponse?> GetProfileAsync(long steamId, GetUserProfileRequest request, CancellationToken ct = default);
    Task<UserProfileResponse?> GetBasicProfileByPublicIdAsync(
        Guid publicId,
        GetUserProfileRequest request,
        CancellationToken ct = default);
}
