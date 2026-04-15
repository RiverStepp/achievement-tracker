using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.DTOs.Steam;
using AchievementTracker.Data.Data;
using AchievementTracker.Data.Entities;
using AchievementTracker.Data.Enums;
using Microsoft.EntityFrameworkCore;

namespace AchievementTracker.Api.DataAccess.Repositories;

public sealed class AppUserRepository(AppDbContext db): IAppUserRepository
{
     private readonly AppDbContext _db = db;

     public async Task<(int AppUserId, Guid PublicId)> UpsertSteamUserAsync(
          long steamId64,
          string canonicalSteamId,
          SteamProfileDto? steamProfile,
          CancellationToken ct = default
     )
     {
          await using var transaction = await _db.Database.BeginTransactionAsync(ct);

          var login = await GetOrCreateSteamLoginAsync(canonicalSteamId, ct);
          await GetOrCreateSteamProfileAsync(steamId64, login.UserExternalLoginId, steamProfile, ct);

          login.AppUser.LastLoginDate = DateTime.UtcNow;

          await _db.SaveChangesAsync(ct);
          await transaction.CommitAsync(ct);

          return (login.AppUserId, login.AppUser.PublicId);
     }

      public async Task<(int AppUserId, Guid PublicId)?> GetAppUserBySteamIdAsync(string canonicalSteamId, CancellationToken ct = default)
     {
          // Casting to (int?) so that this will return null instead of 0 when a record is not found
          return await _db.UserExternalLogins
               .Where(x => x.AuthProvider == eAuthProvider.Steam && x.ProviderUserId == canonicalSteamId)
               .Select(x => ((int AppUserId, Guid PublicId)?)new ValueTuple<int, Guid>(x.AppUserId, x.AppUser.PublicId))
               .SingleOrDefaultAsync(ct);
     }

     public async Task<int?> GetAppUserIdByPublicIdAsync(Guid publicId, CancellationToken ct = default)
     {
          return await _db.AppUsers
               .Where(x => x.PublicId == publicId)
               .Select(x => (int?)x.AppUserId)
               .SingleOrDefaultAsync(ct);
     }

     #region helpers
     private async Task<UserExternalLogin> GetOrCreateSteamLoginAsync(string canonicalSteamId, CancellationToken ct)
     {
          var login = await _db.UserExternalLogins
            .Include(x => x.AppUser)
            .SingleOrDefaultAsync(x =>
                x.AuthProvider == eAuthProvider.Steam &&
                x.ProviderUserId == canonicalSteamId,
                ct);

          // User exists
          if (login != null)
               return login;

          // User does not exist 
          var user = new AppUser
          {
               IsListedOnLeaderboards = true,
               LastLoginDate = DateTime.UtcNow,
          };

          login = new UserExternalLogin
          {
               AppUser = user,
               AuthProvider = eAuthProvider.Steam,
               ProviderUserId = canonicalSteamId,
          };

          _db.UserExternalLogins.Add(login);
          await _db.SaveChangesAsync(ct);

          return login;
     }

     private async Task GetOrCreateSteamProfileAsync(
          long steamId64,
          int externalLoginId,
          SteamProfileDto? steamProfile,
          CancellationToken ct
     )
     {
          var profile = await _db.UserSteamProfiles
            .SingleOrDefaultAsync(x => x.SteamId == steamId64, ct);

          if(profile == null)
          {
               profile = new UserSteamProfile
               {
                    SteamId = steamId64,
                    UserExternalLoginId = externalLoginId
               };

               if (steamProfile != null)
                    ApplySteamProfileData(profile, steamProfile);

               _db.UserSteamProfiles.Add(profile);
               return;
          }

          if (profile.UserExternalLoginId == null)
          {
               profile.UserExternalLoginId = externalLoginId;
          }
          // this should never happen
          else if (profile.UserExternalLoginId != externalLoginId)
          {
               throw new InvalidOperationException("Steam profile already linked to a different external login.");
          }

          if (steamProfile != null)
               ApplySteamProfileData(profile, steamProfile);
     }

     private static void ApplySteamProfileData(UserSteamProfile profile, SteamProfileDto steamProfile)
     {
          profile.PersonaName = steamProfile.PersonaName;
          profile.ProfileUrl = steamProfile.ProfileUrl;
          profile.AvatarSmallUrl = steamProfile.AvatarSmallUrl;
          profile.AvatarMediumUrl = steamProfile.AvatarMediumUrl;
          profile.AvatarFullUrl = steamProfile.AvatarFullUrl;
          profile.IsPrivate = steamProfile.IsPrivate;
          profile.LastSyncedDate = DateTime.UtcNow;
          profile.LastCheckedDate = DateTime.UtcNow;
     }
     #endregion
}

