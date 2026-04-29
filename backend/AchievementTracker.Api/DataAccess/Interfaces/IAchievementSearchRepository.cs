using AchievementTracker.Api.Models.Responses.Profile;
using AchievementTracker.Api.Models.Responses.Steam;

namespace AchievementTracker.Api.DataAccess.Interfaces;

public interface IAchievementSearchRepository
{
    Task<PagedResultDto<AchievementSearchItemDto>> SearchAchievementsAsync(
        string searchTerm,
        int pageNumber,
        int pageSize,
        CancellationToken ct = default);
}
