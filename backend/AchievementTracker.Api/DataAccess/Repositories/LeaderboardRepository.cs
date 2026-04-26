using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.DTOs.Leaderboard;
using AchievementTracker.Data.Data;
using AchievementTracker.Data.Entities;
using AchievementTracker.Data.Enums;
using Microsoft.EntityFrameworkCore;

namespace AchievementTracker.Api.DataAccess.Repositories;

public sealed class LeaderboardRepository(AppDbContext db) : ILeaderboardRepository
{
     private readonly AppDbContext _db = db;

     public async Task<(int TotalUnlocked, int TotalPoints, int TotalGamesTracked, int PerfectGames)> ComputeUserStatsAsync(
          long steamId64,
          CancellationToken ct = default)
     {
          IQueryable<SteamAchievement> unlockedJoin = ActiveUnlockedAchievementsForSteam(steamId64);

          int totalUnlocked = await unlockedJoin.CountAsync(ct);
          int totalPoints = await unlockedJoin.SumAsync(sa => sa.Points, ct);
          int totalGamesTracked = await unlockedJoin.Select(sa => sa.GameId).Distinct().CountAsync(ct);

          int perfectGames = await _db.SteamAchievements
               .Where(sa => sa.IsActive)
               .GroupBy(sa => sa.GameId)
               .Select(g => new
               {
                    Total = g.Count(),
                    Unlocked = g.Count(sa => sa.UserAchievements.Any(sua =>
                         sua.SteamId == steamId64 && sua.IsActive)),
               })
               .Where(x => x.Total > 0 && x.Total == x.Unlocked)
               .CountAsync(ct);

          return (totalUnlocked, totalPoints, totalGamesTracked, perfectGames);
     }

     public async Task<AchievementSummaryDto?> GetAchievementSummaryAsync(int appUserId, CancellationToken ct = default)
     {
          long? steamId64 = await TryGetSteamId64ForAppUserAsync(appUserId, ct);
          if (steamId64 is null)
               return null;

          long sid = steamId64.Value;

          (int totalUnlocked, int totalPoints, int totalGamesTracked, int perfectGames) =
               await ComputeUserStatsAsync(sid, ct);

          DateTime? lastUnlocked = await _db.SteamUserAchievements
               .AsNoTracking()
               .Where(sua => sua.SteamId == sid && sua.IsActive)
               .OrderByDescending(sua => sua.UnlockedAt)
               .Select(sua => (DateTime?)sua.UnlockedAt)
               .FirstOrDefaultAsync(ct);

          return new AchievementSummaryDto(
               totalUnlocked,
               totalGamesTracked,
               perfectGames,
               totalPoints,
               lastUnlocked);
     }

     public async Task<LeaderboardPageDto> GetLeaderboardPageAsync(int page, int pageSize, CancellationToken ct = default)
     {
          var eligibleRows = await (
               from profile in _db.UserSteamProfiles.AsNoTracking()
               where profile.IsActive
               join loginCandidate in _db.UserExternalLogins.AsNoTracking()
                    .Where(x => x.AuthProvider == eAuthProvider.Steam && x.IsActive)
                    on profile.UserExternalLoginId equals loginCandidate.UserExternalLoginId into loginJoin
               from login in loginJoin.DefaultIfEmpty()
               join appUserCandidate in _db.AppUsers.AsNoTracking().Where(x => x.IsActive)
                    on login.AppUserId equals appUserCandidate.AppUserId into appUserJoin
               from appUser in appUserJoin.DefaultIfEmpty()
               where login == null || (appUser != null && appUser.IsListedOnLeaderboards)
               select new
               {
                    PublicId = appUser != null ? (Guid?)appUser.PublicId : null,
                    Handle = appUser != null ? appUser.Handle : null,
                    IsClaimed = login != null && appUser != null,
                    profile.SteamId,
                    profile.PersonaName,
                    AvatarUrl = profile.AvatarMediumUrl,
                    profile.ProfileUrl,
               }).ToListAsync(ct);

          if (eligibleRows.Count == 0)
               return new LeaderboardPageDto([], 0, page, pageSize);

          HashSet<long> eligibleSteamIds = eligibleRows.Select(r => r.SteamId).ToHashSet();

          var unlockedCounts = await (
               from sua in _db.SteamUserAchievements.AsNoTracking()
               where sua.IsActive && eligibleSteamIds.Contains(sua.SteamId)
               join sa in _db.SteamAchievements.AsNoTracking() on sua.AchievementId equals sa.Id
               where sa.IsActive
               group sa by sua.SteamId into g
               select new
               {
                    SteamId = g.Key,
                    TotalAchievementsUnlocked = g.Count(),
                    TotalPoints = g.Sum(x => x.Points),
               }).ToListAsync(ct);

          var distinctGames = await (
               from sua in _db.SteamUserAchievements.AsNoTracking()
               where sua.IsActive && eligibleSteamIds.Contains(sua.SteamId)
               join sa in _db.SteamAchievements.AsNoTracking() on sua.AchievementId equals sa.Id
               where sa.IsActive
               group sa.GameId by sua.SteamId into g
               select new { SteamId = g.Key, TotalGamesTracked = g.Distinct().Count() }).ToListAsync(ct);

          var gamesBySteam = distinctGames.ToDictionary(x => x.SteamId, x => x.TotalGamesTracked);
          var statsDict = new Dictionary<long, (int Unlocked, int Points, int Games)>();
          foreach (var row in unlockedCounts)
          {
               gamesBySteam.TryGetValue(row.SteamId, out int games);
               statsDict[row.SteamId] = (row.TotalAchievementsUnlocked, row.TotalPoints, games);
          }

          var unlockedBySteamGame = await (
               from sua in _db.SteamUserAchievements.AsNoTracking()
               where sua.IsActive && eligibleSteamIds.Contains(sua.SteamId)
               join sa in _db.SteamAchievements.AsNoTracking() on sua.AchievementId equals sa.Id
               where sa.IsActive
               group sua by new { sua.SteamId, sa.GameId } into g
               select new { g.Key.SteamId, g.Key.GameId, Unlocked = g.Count() }).ToListAsync(ct);

          Dictionary<int, int> totalsByGame;
          if (unlockedBySteamGame.Count == 0)
               totalsByGame = new Dictionary<int, int>();
          else
          {
               HashSet<int> gameIds = unlockedBySteamGame.Select(x => x.GameId).ToHashSet();
               totalsByGame = await _db.SteamAchievements
                    .AsNoTracking()
                    .Where(sa => sa.IsActive && gameIds.Contains(sa.GameId))
                    .GroupBy(sa => sa.GameId)
                    .Select(g => new { GameId = g.Key, Total = g.Count() })
                    .ToDictionaryAsync(x => x.GameId, x => x.Total, ct);
          }

          var perfectBySteam = new Dictionary<long, int>();
          foreach (var row in unlockedBySteamGame)
          {
               if (!totalsByGame.TryGetValue(row.GameId, out int totalInGame) || totalInGame <= 0 || row.Unlocked != totalInGame)
                    continue;

               perfectBySteam.TryGetValue(row.SteamId, out int n);
               perfectBySteam[row.SteamId] = n + 1;
          }

          var lastUnlockedBySteam = await _db.SteamUserAchievements
               .AsNoTracking()
               .Where(sua => sua.IsActive && eligibleSteamIds.Contains(sua.SteamId))
               .GroupBy(sua => sua.SteamId)
               .Select(g => new { SteamId = g.Key, Last = g.Max(sua => sua.UnlockedAt) })
               .ToDictionaryAsync(x => x.SteamId, x => (DateTime?)x.Last, ct);

          var ranked = eligibleRows
               .Select(eu =>
               {
                    (int unlocked, int points, int games) = statsDict.GetValueOrDefault(eu.SteamId);
                    perfectBySteam.TryGetValue(eu.SteamId, out int perfect);
                    lastUnlockedBySteam.TryGetValue(eu.SteamId, out DateTime? last);
                    return new
                    {
                         eu.PublicId,
                         eu.SteamId,
                         eu.IsClaimed,
                         PersonaName = !string.IsNullOrWhiteSpace(eu.Handle) ? eu.Handle : eu.PersonaName,
                         eu.AvatarUrl,
                         eu.ProfileUrl,
                         TotalAchievementsUnlocked = unlocked,
                         TotalGamesTracked = games,
                         PerfectGamesCount = perfect,
                         TotalPoints = points,
                         LastSyncedDate = last,
                    };
               })
               .OrderByDescending(x => x.TotalPoints)
               .ThenByDescending(x => x.PerfectGamesCount)
               .ThenByDescending(x => x.TotalAchievementsUnlocked)
               .ToList();

          int totalCount = ranked.Count;
          int skip = (page - 1) * pageSize;
          var pageRows = ranked.Skip(skip).Take(pageSize).ToList();

          int baseRank = skip + 1;
          var entries = pageRows
               .Select((e, i) => new LeaderboardEntryDto(
                    Rank: baseRank + i,
                    PublicId: e.PublicId,
                    SteamProfileId: e.SteamId,
                    IsClaimed: e.IsClaimed,
                    PersonaName: e.PersonaName,
                    AvatarUrl: e.AvatarUrl,
                    ProfileUrl: e.ProfileUrl,
                    TotalAchievementsUnlocked: e.TotalAchievementsUnlocked,
                    TotalGamesTracked: e.TotalGamesTracked,
                    PerfectGamesCount: e.PerfectGamesCount,
                    TotalPoints: e.TotalPoints,
                    LastSyncedDate: e.LastSyncedDate))
               .ToList();

          return new LeaderboardPageDto(entries, totalCount, page, pageSize);
     }

     private async Task<long?> TryGetSteamId64ForAppUserAsync(int appUserId, CancellationToken ct)
     {
          long steamId = await (
               from login in _db.UserExternalLogins.AsNoTracking()
               join profile in _db.UserSteamProfiles.AsNoTracking() on login.UserExternalLoginId equals profile.UserExternalLoginId
               where login.AppUserId == appUserId
                    && login.AuthProvider == eAuthProvider.Steam
                    && login.IsActive
                    && profile.IsActive
               select profile.SteamId).FirstOrDefaultAsync(ct);

          return steamId == 0 ? null : steamId;
     }

     private IQueryable<SteamAchievement> ActiveUnlockedAchievementsForSteam(long steamId64)
     {
          return from sua in _db.SteamUserAchievements.AsNoTracking()
                 where sua.SteamId == steamId64 && sua.IsActive
                 join sa in _db.SteamAchievements.AsNoTracking() on sua.AchievementId equals sa.Id
                 where sa.IsActive
                 select sa;
     }
}
