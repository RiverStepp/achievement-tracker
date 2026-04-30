using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.Responses.Profile;
using AchievementTracker.Api.Models.Responses.Steam;
using AchievementTracker.Data.Data;
using Microsoft.EntityFrameworkCore;

namespace AchievementTracker.Api.DataAccess.Repositories;

public sealed class AchievementSearchRepository(AppDbContext db) : IAchievementSearchRepository
{
    private readonly AppDbContext _db = db;

    public async Task<PagedResultDto<AchievementSearchItemDto>> SearchAchievementsAsync(
        string searchTerm,
        int pageNumber,
        int pageSize,
        CancellationToken ct = default)
    {
        string escapedSearchTerm = EscapeLikePattern(searchTerm);
        string containsPattern = $"%{escapedSearchTerm}%";
        string startsWithPattern = $"{escapedSearchTerm}%";

        IQueryable<AchievementSearchItemDto> query = _db.SteamAchievements
            .AsNoTracking()
            .Where(a => a.IsActive && EF.Functions.Like(a.Name, containsPattern, @"\"))
            .OrderBy(a => EF.Functions.Like(a.Name, startsWithPattern, @"\") ? 0 : 1)
            .ThenBy(a => a.Name)
            .Select(a => new AchievementSearchItemDto(
                a.Id,
                a.Name,
                a.Description,
                a.IconUrl,
                a.Points,
                a.Stats == null ? null : (decimal?)a.Stats.GlobalPercentage,
                a.GameId,
                a.Game.Name,
                a.Game.HeaderImageUrl));

        int totalCount = await query.CountAsync(ct);
        int skip = (pageNumber - 1) * pageSize;

        IReadOnlyList<AchievementSearchItemDto> items = await query
            .Skip(skip)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResultDto<AchievementSearchItemDto>(pageNumber, pageSize, totalCount, items);
    }

    private static string EscapeLikePattern(string value)
    {
        return value
            .Replace(@"\", @"\\", StringComparison.Ordinal)
            .Replace("%", @"\%", StringComparison.Ordinal)
            .Replace("_", @"\_", StringComparison.Ordinal)
            .Replace("[", @"\[", StringComparison.Ordinal);
    }
}
