using AchievementTracker.Api.Models.DTOs.Settings;
using AchievementTracker.Api.Models.Responses.Settings;
using AchievementTracker.Api.Models.Results;

namespace AchievementTracker.Api.Services.Interfaces;

public interface IUserSettingsService
{
    Task<UserSettingsResponseDto?> GetSettingsAsync(int appUserId, CancellationToken ct = default);

    Task<UpdateUserSettingsResult> UpdateSettingsAsync(
        int appUserId,
        UpdateMySettingsRequestDto request,
        UserSettingsImageUploads? imageUploads = null,
        CancellationToken ct = default);
}
