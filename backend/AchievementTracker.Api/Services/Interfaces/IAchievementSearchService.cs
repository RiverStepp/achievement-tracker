using AchievementTracker.Api.Models.Requests;
using AchievementTracker.Api.Models.Responses.Profile;
using AchievementTracker.Api.Models.Responses.Steam;

namespace AchievementTracker.Api.Services.Interfaces;

public interface IAchievementSearchService
{
    Task<PagedResultDto<AchievementSearchItemDto>> SearchAchievementsAsync(
        SearchAchievementsRequest request,
        CancellationToken ct = default);
}
