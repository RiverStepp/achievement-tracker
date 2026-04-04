using AchievementTracker.Api.Models.DTOs.Social;
using AchievementTracker.Api.Models.Requests;
using AchievementTracker.Api.Models.Results;

namespace AchievementTracker.Api.Services.Interfaces;

public interface IMeService
{
     Task<SetSocialIdentityResult> SetSocialIdentityAsync(
          int appUserId,
          SetMySocialIdentityRequestDto request,
          CancellationToken ct = default);

     Task<PinAchievementResult> PinAchievementAsync(
          int appUserId,
          PinMyAchievementRequestDto request,
          CancellationToken ct = default);

     Task<UpdatePinnedDisplayOrderResult> UpdatePinnedAchievementDisplayOrderAsync(
          int appUserId,
          int appUserPinnedAchievementId,
          UpdatePinnedAchievementDisplayOrderRequestDto request,
          CancellationToken ct = default);
}
