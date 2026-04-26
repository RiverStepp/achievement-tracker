using AchievementTracker.Api.Models.Requests;
using AchievementTracker.Api.Models.Responses.Profile;

namespace AchievementTracker.Api.Services.Interfaces;

public interface IUserProfileService
{
    Task<UserProfileResponse?> GetProfileAsync(Guid publicId, GetUserProfileRequest request, CancellationToken ct = default);
    Task<Guid?> GetPublicIdByHandleAsync(string handle, CancellationToken ct = default);
}
