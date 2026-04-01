using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.DTOs.Leaderboard;
using AchievementTracker.Data.Data;
using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace AchievementTracker.Api.DataAccess.Repositories;

public sealed class LeaderboardRepository(AppDbContext db) : ILeaderboardRepository
{
     private readonly AppDbContext _db = db;

     public async Task UpsertAchievementSummaryAsync(
          int appUserId,
          int totalAchievementsUnlocked,
          int totalGamesTracked,
          int perfectGamesCount,
          int totalPoints,
          CancellationToken ct = default
     )
     {
          // Try to find an existing summary row for this user
          var summary = await _db.UserAchievementSummaries
               .SingleOrDefaultAsync(x => x.AppUserId == appUserId, ct);

          // If none exists, create a new entity and track it for insertion
          if (summary == null)
          {
               summary = new UserAchievementSummary { AppUserId = appUserId };
               _db.UserAchievementSummaries.Add(summary);
          }

          summary.TotalAchievementsUnlocked = totalAchievementsUnlocked;
          summary.TotalGamesTracked = totalGamesTracked;
          summary.PerfectGamesCount = perfectGamesCount;
          summary.TotalPoints = totalPoints;
          summary.LastSyncedDate = DateTime.UtcNow;

          await _db.SaveChangesAsync(ct);
     }

     // Private result types for raw SQL projections
     private sealed class UserStatsResult
     {
          public int TotalUnlocked { get; init; }
          public int TotalPoints { get; init; }
          public int TotalGamesTracked { get; init; }
     }
 
     private sealed class PerfectGamesResult
     {
          public int PerfectGames { get; init; }
     }
 
     public async Task<(int TotalUnlocked, int TotalPoints, int TotalGamesTracked, int PerfectGames)> ComputeUserStatsAsync(
          long steamId64,
          CancellationToken ct = default
     )
     {
          // Sum points and count unlocked achievements and distinct games for this Steam user
          var stats = await _db.Database.SqlQuery<UserStatsResult>(
               $"""
               SELECT
                    COUNT(sua.Id)             AS TotalUnlocked,
                    ISNULL(SUM(sa.Points), 0) AS TotalPoints,
                    COUNT(DISTINCT sa.GameId) AS TotalGamesTracked
               FROM SteamUserAchievements sua
               JOIN SteamAchievements sa ON sua.AchievementId = sa.Id
               WHERE sua.SteamId   = {steamId64}
                 AND sua.IsActive  = 1
                 AND sa.IsActive   = 1
               """
          ).FirstOrDefaultAsync(ct);
 
          // A perfect game = user has unlocked every active achievement in that game
          var perfect = await _db.Database.SqlQuery<PerfectGamesResult>(
               $"""
               SELECT COUNT(*) AS PerfectGames
               FROM (
                    SELECT sa.GameId
                    FROM SteamAchievements sa
                    LEFT JOIN SteamUserAchievements sua
                         ON  sa.Id          = sua.AchievementId
                         AND sua.SteamId    = {steamId64}
                         AND sua.IsActive   = 1
                    WHERE sa.IsActive = 1
                    GROUP BY sa.GameId
                    HAVING COUNT(sa.Id) > 0
                       AND COUNT(sa.Id) = SUM(CASE WHEN sua.Id IS NOT NULL THEN 1 ELSE 0 END)
               ) g
               """
          ).FirstOrDefaultAsync(ct);
 
          return (
               stats?.TotalUnlocked     ?? 0,
               stats?.TotalPoints       ?? 0,
               stats?.TotalGamesTracked ?? 0,
               perfect?.PerfectGames    ?? 0
          );
     }
 
     public async Task<AchievementSummaryDto?> GetAchievementSummaryAsync(int appUserId, CancellationToken ct = default)
     {
          return await _db.UserAchievementSummaries
               .Where(x => x.AppUserId == appUserId && x.IsActive)
               .Select(x => new AchievementSummaryDto(
                    x.TotalAchievementsUnlocked,
                    x.TotalGamesTracked,
                    x.PerfectGamesCount,
                    x.TotalPoints,
                    x.LastSyncedDate
               ))
               .SingleOrDefaultAsync(ct);
     }

     public async Task<LeaderboardPageDto> GetLeaderboardPageAsync(int page, int pageSize, CancellationToken ct = default)
     {
          // Build ranked query: users opted-in with synced achievement data, joined to their Steam profile
          var query =
               from summary in _db.UserAchievementSummaries
               where summary.IsActive // Exclude soft-deleted summaries
               join appUser in _db.AppUsers on summary.AppUserId equals appUser.AppUserId
               where appUser.IsListedOnLeaderboards && appUser.IsActive
               join login in _db.UserExternalLogins on appUser.AppUserId equals login.AppUserId
               join profile in _db.UserSteamProfiles
                    on (int?)login.UserExternalLoginId equals profile.UserExternalLoginId
                    into profileGroup
               from profile in profileGroup.DefaultIfEmpty() // Left join: Steam profile may not exist yet
               orderby summary.TotalPoints descending,             // Primary rank: highest points first
                       summary.PerfectGamesCount descending,         // Tiebreak: favour 100% completionists
                       summary.TotalAchievementsUnlocked descending  // Final tiebreak: most achievements wins
               select new
               {
                    appUser.PublicId,
                    summary.TotalAchievementsUnlocked,
                    summary.TotalGamesTracked,
                    summary.PerfectGamesCount,
                    summary.TotalPoints,
                    summary.LastSyncedDate,
                    PersonaName = profile != null ? profile.PersonaName : null,
                    AvatarUrl = profile != null ? profile.AvatarMediumUrl : null,
                    ProfileUrl = profile != null ? profile.ProfileUrl : null
               };

          int totalCount = await query.CountAsync(ct);

          // Fetch only the requested page of results
          var rawEntries = await query
               .Skip((page - 1) * pageSize)
               .Take(pageSize)
               .ToListAsync(ct);

          // Calculate the rank offset so rank 1 stays correct across pages
          int baseRank = (page - 1) * pageSize + 1;
          var entries = rawEntries
               .Select((e, i) => new LeaderboardEntryDto(
                    Rank: baseRank + i,
                    PublicId: e.PublicId,
                    PersonaName: e.PersonaName,
                    AvatarUrl: e.AvatarUrl,
                    ProfileUrl: e.ProfileUrl,
                    TotalAchievementsUnlocked: e.TotalAchievementsUnlocked,
                    TotalGamesTracked: e.TotalGamesTracked,
                    PerfectGamesCount: e.PerfectGamesCount,
                    TotalPoints: e.TotalPoints,
                    LastSyncedDate: e.LastSyncedDate
               ))
               .ToList();

          return new LeaderboardPageDto(entries, totalCount, page, pageSize);
     }
}
