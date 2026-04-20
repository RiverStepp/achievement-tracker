using AchievementTracker.Api.Models.Results;
using AchievementTracker.Data.Enums;

namespace AchievementTracker.Api.DataAccess.Interfaces;

public interface IUserPinnedAchievementRepository
{
    Task<PinAchievementResult> TryPinAsync(
        int appUserId,
        int steamAchievementId,
        eAchievementPlatform platformId,
        int maxPinned,
        CancellationToken ct = default);

    Task<UpdatePinnedDisplayOrderResult> TryUpdateDisplayOrderAsync(
        int appUserId,
        int appUserPinnedAchievementId,
        int displayOrder,
        int displayOrderStep,
        CancellationToken ct = default);
}
