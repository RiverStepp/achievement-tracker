using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.DTOs.Social;
using AchievementTracker.Api.Models.Options;
using AchievementTracker.Api.Models.Results;
using AchievementTracker.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace AchievementTracker.Api.Services.BusinessLogic;

public sealed class MeService(IAppUserRepository appUserRepository, IOptions<SocialOptions> socialOptions)
     : IMeService
{
     private const string ErrBothMissing = "Either handle or display name must be provided.";
     private const string ErrHandleTooLongFormat = "Handle must be {0} characters or fewer.";
     private const string ErrHandleInvalid =
          "Handle must start with @ and only contain letters, numbers, or underscore.";
     private const string ErrDisplayNameTooLongFormat =
          "Display name must be {0} characters or fewer.";
     private const string ErrHandleInUse = "Handle is already in use.";
     private const string ErrUserNotFound = "Authenticated user was not found.";

     private readonly IAppUserRepository _appUserRepository = appUserRepository;
     private readonly SocialOptions _social = socialOptions.Value;

     public async Task<SetSocialIdentityResult> SetSocialIdentityAsync(
          int appUserId,
          SetMySocialIdentityRequestDto request,
          CancellationToken ct = default)
     {
          string? handle = request.Handle?.Trim();
          string? displayName = request.DisplayName?.Trim();

          bool hasHandle = !string.IsNullOrWhiteSpace(handle);
          bool hasDisplayName = !string.IsNullOrWhiteSpace(displayName);
          if (!hasHandle && !hasDisplayName)
               return SetSocialIdentityResult.Failed(ErrBothMissing);

          if (hasHandle)
          {
               if (handle!.Length > _social.MaxHandleLength)
               {
                    return SetSocialIdentityResult.Failed(
                         string.Format(ErrHandleTooLongFormat, _social.MaxHandleLength));
               }

               if (!IsValidHandle(handle, _social.MaxHandleLength))
                    return SetSocialIdentityResult.Failed(ErrHandleInvalid);
          }
          else
          {
               handle = null;
          }

          if (hasDisplayName)
          {
               if (displayName!.Length > _social.MaxDisplayNameLength)
               {
                    return SetSocialIdentityResult.Failed(
                         string.Format(ErrDisplayNameTooLongFormat, _social.MaxDisplayNameLength));
               }
          }
          else
          {
               displayName = null;
          }

          if (handle != null && await _appUserRepository.HandleExistsAsync(handle, appUserId, ct))
               return SetSocialIdentityResult.Failed(ErrHandleInUse);

          try
          {
               bool success = await _appUserRepository.SetSocialIdentityAsync(
                    appUserId,
                    handle,
                    displayName,
                    ct);

               return success
                    ? SetSocialIdentityResult.Ok()
                    : SetSocialIdentityResult.Failed(ErrUserNotFound);
          }
          catch (DbUpdateException)
          {
               return SetSocialIdentityResult.Failed(ErrHandleInUse);
          }
     }

     private static bool IsValidHandle(string handle, int maxTotalLength)
     {
          if (handle.Length < 2 || handle[0] != '@')
               return false;

          if (handle.Length > maxTotalLength)
               return false;

          ReadOnlySpan<char> rest = handle.AsSpan(1);
          foreach (char c in rest)
          {
               if (!(char.IsAsciiLetterOrDigit(c) || c == '_'))
                    return false;
          }

          return true;
     }
}
