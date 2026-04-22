using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.Results;
using AchievementTracker.Data.Data;
using AchievementTracker.Data.Entities;
using AchievementTracker.Data.Enums;
using Microsoft.EntityFrameworkCore;

namespace AchievementTracker.Api.DataAccess.Repositories;

public sealed class UserPinnedAchievementRepository(AppDbContext db) : IUserPinnedAchievementRepository
{
    private readonly AppDbContext _db = db;

    public async Task<PinAchievementResult> TryPinAsync(
        int appUserId,
        int steamAchievementId,
        eAchievementPlatform platformId,
        int maxPinned,
        CancellationToken ct = default)
    {
        if (platformId != eAchievementPlatform.Steam)
            return PinAchievementResult.Failed("Only Steam achievements can be pinned for now.");

        await using var tx = await _db.Database.BeginTransactionAsync(
            System.Data.IsolationLevel.Serializable,
            ct);

        long? steamId = await _db.UserExternalLogins
            .AsNoTracking()
            .Where(x => x.AppUserId == appUserId && x.AuthProvider == eAuthProvider.Steam && x.IsActive)
            .Select(x => x.SteamProfile != null ? (long?)x.SteamProfile.SteamId : null)
            .SingleOrDefaultAsync(ct);

        if (steamId == null)
        {
            await tx.RollbackAsync(ct);
            return PinAchievementResult.Failed("Steam profile not found.");
        }

        bool alreadyPinned = await _db.AppUserPinnedAchievements.AnyAsync(
            x => x.AppUserId == appUserId
                && x.PlatformId == platformId
                && x.SteamAchievementId == steamAchievementId
                && x.IsActive,
            ct);
        if (alreadyPinned)
        {
            await tx.CommitAsync(ct);
            return PinAchievementResult.Ok();
        }

        int activeCount = await _db.AppUserPinnedAchievements.CountAsync(
            x => x.AppUserId == appUserId && x.IsActive,
            ct);
        if (activeCount >= maxPinned)
        {
            await tx.RollbackAsync(ct);
            return PinAchievementResult.Failed(
                $"You can pin at most {maxPinned} achievements.");
        }

        bool unlocked = await _db.SteamUserAchievements.AnyAsync(
            x => x.SteamId == steamId && x.AchievementId == steamAchievementId && x.IsActive,
            ct);
        if (!unlocked)
        {
            await tx.RollbackAsync(ct);
            return PinAchievementResult.Failed("Achievement is not unlocked for your account.");
        }

        bool achievementExists = await _db.SteamAchievements.AnyAsync(
            x => x.Id == steamAchievementId && x.IsActive,
            ct);
        if (!achievementExists)
        {
            await tx.RollbackAsync(ct);
            return PinAchievementResult.Failed("Achievement was not found.");
        }

        int nextDisplayOrder = await _db.AppUserPinnedAchievements
            .Where(x => x.AppUserId == appUserId && x.IsActive)
            .Select(x => (int?)x.DisplayOrder)
            .MaxAsync(ct) ?? 0;
        nextDisplayOrder += 100;

        _db.AppUserPinnedAchievements.Add(
            new AppUserPinnedAchievement
            {
                AppUserId = appUserId,
                PlatformId = platformId,
                SteamAchievementId = steamAchievementId,
                DisplayOrder = nextDisplayOrder
            });

        try
        {
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return PinAchievementResult.Ok();
        }
        catch (DbUpdateException)
        {
            await tx.RollbackAsync(ct);
            return PinAchievementResult.Failed("Unable to pin this achievement.");
        }
    }

    public async Task<UpdatePinnedDisplayOrderResult> TryUpdateDisplayOrderAsync(
        int appUserId,
        int appUserPinnedAchievementId,
        int displayOrder,
        int displayOrderStep,
        CancellationToken ct = default)
    {
        if (displayOrder <= 0 || displayOrder % displayOrderStep != 0)
        {
            return UpdatePinnedDisplayOrderResult.Failed(
                $"Display order must be a positive multiple of {displayOrderStep}.");
        }

        AppUserPinnedAchievement? row = await _db.AppUserPinnedAchievements
            .SingleOrDefaultAsync(
                x => x.AppUserPinnedAchievementId == appUserPinnedAchievementId
                    && x.AppUserId == appUserId
                    && x.IsActive,
                ct);

        if (row == null)
            return UpdatePinnedDisplayOrderResult.Failed("Pinned achievement was not found.");

        row.DisplayOrder = displayOrder;

        try
        {
            await _db.SaveChangesAsync(ct);
            return UpdatePinnedDisplayOrderResult.Ok();
        }
        catch (DbUpdateException)
        {
            return UpdatePinnedDisplayOrderResult.Failed("Unable to update display order.");
        }
    }

    public async Task<UnpinAchievementResult> TryUnpinAsync(
        int appUserId,
        int appUserPinnedAchievementId,
        CancellationToken ct = default)
    {
        AppUserPinnedAchievement? row = await _db.AppUserPinnedAchievements
            .SingleOrDefaultAsync(
                x => x.AppUserPinnedAchievementId == appUserPinnedAchievementId
                    && x.AppUserId == appUserId
                    && x.IsActive,
                ct);

        if (row == null)
            return UnpinAchievementResult.Failed("Pinned achievement was not found.");

        row.IsActive = false;

        try
        {
            await _db.SaveChangesAsync(ct);
            return UnpinAchievementResult.Ok();
        }
        catch (DbUpdateException)
        {
            return UnpinAchievementResult.Failed("Unable to unpin achievement.");
        }
    }
}
