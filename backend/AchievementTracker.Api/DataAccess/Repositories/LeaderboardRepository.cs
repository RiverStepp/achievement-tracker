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
          summary.LastSyncedDate = DateTime.UtcNow;

          await _db.SaveChangesAsync(ct);
     }

     public async Task<AchievementSummaryDto?> GetAchievementSummaryAsync(int appUserId, CancellationToken ct = default)
     {
          return await _db.UserAchievementSummaries
               .Where(x => x.AppUserId == appUserId && x.IsActive)
               .Select(x => new AchievementSummaryDto(
                    x.TotalAchievementsUnlocked,
                    x.TotalGamesTracked,
                    x.PerfectGamesCount,
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
               orderby summary.TotalAchievementsUnlocked descending, // Primary rank: most achievements first
                       summary.PerfectGamesCount descending, // Tiebreak: favour 100% completionists
                       summary.TotalGamesTracked descending  // Final tiebreak: more games tracked wins
               select new
               {
                    appUser.PublicId,
                    summary.TotalAchievementsUnlocked,
                    summary.TotalGamesTracked,
                    summary.PerfectGamesCount,
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
                    LastSyncedDate: e.LastSyncedDate
               ))
               .ToList();

          return new LeaderboardPageDto(entries, totalCount, page, pageSize);
     }
}
