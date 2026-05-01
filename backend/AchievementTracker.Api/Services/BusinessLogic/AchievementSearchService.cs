using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.Options;
using AchievementTracker.Api.Models.Requests;
using AchievementTracker.Api.Models.Responses.Profile;
using AchievementTracker.Api.Models.Responses.Steam;
using AchievementTracker.Api.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace AchievementTracker.Api.Services.BusinessLogic;

public sealed class AchievementSearchService(
    IAchievementSearchRepository achievementSearchRepository,
    IOptions<ProfileOptions> profileOptions) : IAchievementSearchService
{
    private readonly IAchievementSearchRepository _achievementSearchRepository = achievementSearchRepository;
    private readonly IOptions<ProfileOptions> _profileOptions = profileOptions;

    public Task<PagedResultDto<AchievementSearchItemDto>> SearchAchievementsAsync(
        SearchAchievementsRequest request,
        CancellationToken ct = default)
    {
        string searchTerm = (request.Query ?? string.Empty).Trim();
        int pageNumber = Math.Max(1, request.PageNumber);
        int pageSize = request.PageSize > 0
            ? Math.Min(request.PageSize, SearchAchievementsRequest.MaxPageSize)
            : _profileOptions.Value.AchievementsPageSize;

        return _achievementSearchRepository.SearchAchievementsAsync(searchTerm, pageNumber, pageSize, ct);
    }
}
