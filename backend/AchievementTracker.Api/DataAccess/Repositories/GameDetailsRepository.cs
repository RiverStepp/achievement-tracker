using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.Responses.GameDetails;
using AchievementTracker.Data.Data;
using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace AchievementTracker.Api.DataAccess.Repositories;

public sealed class GameDetailsRepository(AppDbContext db) : IGameDetailsRepository
{
    private readonly AppDbContext _db = db;
    private const decimal PercentScale = 100m;

    public async Task<GameDetailsResponse?> GetGameDetailsAsync(
        int gameId,
        bool isAuthenticated,
        long? steamId64,
        CancellationToken ct = default)
    {
        var game = await _db.SteamGames
            .AsNoTracking()
            .Where(g => g.Id == gameId && g.IsActive)
            .Select(
                g => new
                {
                    g.Name,
                    g.HeaderImageUrl,
                    g.SteamAppId,
                    g.ReleaseDate,
                    g.ShortDescription,
                    g.IsRemoved,
                    g.IsUnlisted
                })
            .SingleOrDefaultAsync(ct);

        if (game == null)
            return null;

        IQueryable<SteamAchievement> achievementsForGame = _db.SteamAchievements
            .AsNoTracking()
            .Where(a => a.GameId == gameId && a.IsActive);

        IReadOnlyList<GameDetailsAchievementDto> achievements;
        if (steamId64 is long steamId)
        {
            achievements = await (
                    from a in achievementsForGame
                    join s in _db.SteamAchievementStats.AsNoTracking() on a.Id equals s.AchievementId into statGroup
                    from s in statGroup.DefaultIfEmpty()
                    join ua in _db.SteamUserAchievements.AsNoTracking()
                            .Where(ua => ua.SteamId == steamId && ua.IsActive)
                        on a.Id equals ua.AchievementId into uaGroup
                    from ua in uaGroup.DefaultIfEmpty()
                    orderby a.Points, a.Id
                    select new GameDetailsAchievementDto(
                        a.Id,
                        a.Name,
                        a.Description,
                        a.IconUrl,
                        a.Points,
                        a.IsHidden,
                        a.IsUnobtainable,
                        a.IsBuggy,
                        a.IsConditionallyObtainable,
                        a.IsMultiplayer,
                        a.IsMissable,
                        a.IsGrind,
                        a.IsRandom,
                        a.IsDateSpecific,
                        a.IsViral,
                        a.IsDLC,
                        a.IsWorldRecord,
                        s == null ? null : (decimal?)s.GlobalPercentage,
                        (bool?)(ua != null)))
                .ToListAsync(ct);
        }
        else
        {
            achievements = await (
                    from a in achievementsForGame
                    join s in _db.SteamAchievementStats.AsNoTracking() on a.Id equals s.AchievementId into statGroup
                    from s in statGroup.DefaultIfEmpty()
                    orderby a.Points, a.Id
                    select new GameDetailsAchievementDto(
                        a.Id,
                        a.Name,
                        a.Description,
                        a.IconUrl,
                        a.Points,
                        a.IsHidden,
                        a.IsUnobtainable,
                        a.IsBuggy,
                        a.IsConditionallyObtainable,
                        a.IsMultiplayer,
                        a.IsMissable,
                        a.IsGrind,
                        a.IsRandom,
                        a.IsDateSpecific,
                        a.IsViral,
                        a.IsDLC,
                        a.IsWorldRecord,
                        s == null ? null : (decimal?)s.GlobalPercentage,
                        (bool?)null))
                .ToListAsync(ct);
        }

        int totalAvailablePoints = achievements.Sum(x => x.Points);

        GameDetailsAuthenticatedProgressDto? progress = null;
        if (steamId64.HasValue)
        {
            int totalCount = achievements.Count;
            int unlockedCount = achievements.Count(x => x.IsUnlocked == true);
            int pointsEarned = achievements.Where(x => x.IsUnlocked == true).Sum(x => x.Points);
            int lockedCount = totalCount - unlockedCount;
            decimal? completionPercent = totalCount == 0
                ? null
                : (decimal)unlockedCount * PercentScale / totalCount;
            progress = new GameDetailsAuthenticatedProgressDto(
                pointsEarned,
                unlockedCount,
                lockedCount,
                completionPercent);
        }

        return new GameDetailsResponse(
            isAuthenticated,
            game.Name,
            game.HeaderImageUrl,
            game.SteamAppId,
            game.ReleaseDate,
            game.ShortDescription,
            game.IsRemoved,
            game.IsUnlisted,
            totalAvailablePoints,
            progress,
            achievements);
    }
}
