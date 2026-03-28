using AchievementTracker.Api.Models.DTOs.Social;
using AchievementTracker.Api.Models.Results;

namespace AchievementTracker.Api.Services.Interfaces;

public interface IMeService
{
     Task<SetSocialIdentityResult> SetSocialIdentityAsync(
          int appUserId,
          SetMySocialIdentityRequestDto request,
          CancellationToken ct = default);
}
