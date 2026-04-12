using System.Text.RegularExpressions;
using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Helpers;
using AchievementTracker.Api.Models.DTOs.Settings;
using AchievementTracker.Api.Models.Options;
using AchievementTracker.Api.Models.Responses.Settings;
using AchievementTracker.Api.Models.Results;
using AchievementTracker.Api.Services.Interfaces;
using AchievementTracker.Data.Entities;
using AchievementTracker.Data.Enums;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;

namespace AchievementTracker.Api.Services.BusinessLogic;

public sealed class UserSettingsService(
    IUserSettingsRepository userSettingsRepository,
    ILookupRepository lookupRepository,
    IUserProfileMediaStorageService profileMediaStorage,
    IOptions<SocialOptions> socialOptions,
    IOptions<UserSettingsOptions> userSettingsOptions)
    : IUserSettingsService
{
    private const string ErrHandleTooLongFormat = "Handle must be {0} characters or fewer.";
    private const string ErrHandleInvalid =
        "Handle must start with @ and only contain letters, numbers, or underscore.";
    private const string ErrDisplayNameTooLongFormat =
        "Display name must be {0} characters or fewer.";
    private const string ErrHandleInUse = "Handle is already in use.";
    private const string ErrBioTooLongFormat = "Bio must be {0} characters or fewer.";
    private const string ErrSocialLinkTooLongFormat = "Social link value must be {0} characters or fewer.";
    private const string ErrSocialLinkInvalid = "Social link value is not a valid URL or identifier.";
    private const string ErrSocialDuplicatePlatform = "Each social platform may appear only once.";
    private const string ErrLocationHierarchy = "Location must include country before state, and state before city.";
    private const string ErrLocationUnknown = "The selected location is not valid.";
    private const string ErrTimeZoneUnknown = "The selected time zone is not valid.";
    private const string ErrPronounUnknown = "The selected pronouns option is not valid.";
    private const string ErrSocialPlatformUnknown = "Social platform is not valid.";
    private const string ErrSaveGeneric = "Could not save settings. Please try again.";
    private const string ErrUniqueConflict = "This update conflicts with existing data.";
    private const string ErrFkOrReference = "The selected reference data is not valid or no longer exists.";
    private const string ErrInvalidImageContent = "File is not a recognized image format.";
    private const string ErrUnsupportedImageMimeType = "Unsupported image MIME type.";
    private const string ErrMediaFileTooLargeFormat = "Image must be {0} bytes or smaller.";

    private static readonly Regex s_identifierChars = new(
        @"^[a-zA-Z0-9_.@#+\-]+$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private readonly IUserSettingsRepository _repo = userSettingsRepository;
    private readonly ILookupRepository _lookups = lookupRepository;
    private readonly IUserProfileMediaStorageService _profileMedia = profileMediaStorage;
    private readonly SocialOptions _social = socialOptions.Value;
    private readonly UserSettingsOptions _settings = userSettingsOptions.Value;

    public async Task<UserSettingsResponseDto?> GetSettingsAsync(int appUserId, CancellationToken ct = default)
    {
        var values = await _repo.GetUserSettingsValuesAsync(appUserId, ct);
        if (values is null)
            return null;

        var countriesTask = _lookups.GetCountriesAsync(ct);
        var timeZonesTask = _lookups.GetIanaTimeZonesAsync(ct);
        var pronounsTask = _lookups.GetPronounOptionsAsync(ct);
        await Task.WhenAll(countriesTask, timeZonesTask, pronounsTask);

        return new UserSettingsResponseDto(
            values.DisplayName,
            values.Handle,
            values.Bio,
            values.Location,
            values.TimeZone,
            values.Pronouns,
            values.SocialLinks,
            values.ProfileImage,
            values.BannerImage,
            await countriesTask,
            await timeZonesTask,
            await pronounsTask);
    }

    public async Task<UpdateUserSettingsResult> UpdateSettingsAsync(
        int appUserId,
        UpdateMySettingsRequestDto request,
        UserSettingsImageUploads? imageUploads = null,
        CancellationToken ct = default)
    {
        try
        {
            var user = await _repo.GetTrackedUserForSettingsUpdateAsync(appUserId, ct);
            if (user == null)
                return UpdateUserSettingsResult.NotFound("User was not found.");

            if (request.DisplayName != null)
            {
                string trimmed = request.DisplayName.Trim();
                if (trimmed.Length > _social.MaxDisplayNameLength)
                {
                    return UpdateUserSettingsResult.ValidationFailed(
                        string.Format(ErrDisplayNameTooLongFormat, _social.MaxDisplayNameLength));
                }

                string? normalized = trimmed.Length == 0 ? null : trimmed;
                if (!string.Equals(user.DisplayName, normalized, StringComparison.Ordinal))
                    user.DisplayName = normalized;
            }

            if (request.Handle != null)
            {
                string trimmed = request.Handle.Trim();
                string? normalized = trimmed.Length == 0 ? null : trimmed;
                if (normalized != null)
                {
                    if (normalized.Length > _social.MaxHandleLength)
                    {
                        return UpdateUserSettingsResult.ValidationFailed(
                            string.Format(ErrHandleTooLongFormat, _social.MaxHandleLength));
                    }

                    if (!IsValidHandle(normalized, _social.MaxHandleLength))
                        return UpdateUserSettingsResult.ValidationFailed(ErrHandleInvalid);

                    if (await _repo.HandleExistsAsync(normalized, appUserId, ct))
                        return UpdateUserSettingsResult.Conflict(ErrHandleInUse);
                }

                if (!string.Equals(user.Handle, normalized, StringComparison.Ordinal))
                    user.Handle = normalized;
            }

            if (request.Bio != null)
            {
                string trimmed = request.Bio.Trim();
                if (trimmed.Length > _settings.MaxBioLength)
                {
                    return UpdateUserSettingsResult.ValidationFailed(
                        string.Format(ErrBioTooLongFormat, _settings.MaxBioLength));
                }

                string? normalized = trimmed.Length == 0 ? null : trimmed;
                if (!string.Equals(user.Bio, normalized, StringComparison.Ordinal))
                    user.Bio = normalized;
            }

            if (request.UnsetLocation)
            {
                if (user.LocationCountryId != null || user.LocationStateRegionId != null || user.LocationCityId != null)
                {
                    user.LocationCountryId = null;
                    user.LocationStateRegionId = null;
                    user.LocationCityId = null;
                }
            }
            else if (request.Location != null)
            {
                var locResult = await TryApplyLocationAsync(user, request.Location, ct);
                if (locResult != null)
                    return locResult;
            }

            if (request.UnsetTimeZone)
            {
                if (user.IanaTimeZoneId != null)
                    user.IanaTimeZoneId = null;
            }
            else if (request.IanaTimeZoneId.HasValue)
            {
                int tzId = request.IanaTimeZoneId.Value;
                if (!await _repo.IanaTimeZoneExistsAsync(tzId, ct))
                    return UpdateUserSettingsResult.ValidationFailed(ErrTimeZoneUnknown);

                if (user.IanaTimeZoneId != tzId)
                    user.IanaTimeZoneId = tzId;
            }

            if (request.UnsetPronouns)
            {
                if (user.PronounOptionId != null)
                    user.PronounOptionId = null;
            }
            else if (request.PronounOptionId.HasValue)
            {
                int pId = request.PronounOptionId.Value;
                if (!await _repo.PronounOptionExistsAsync(pId, ct))
                    return UpdateUserSettingsResult.ValidationFailed(ErrPronounUnknown);

                if (user.PronounOptionId != pId)
                    user.PronounOptionId = pId;
            }

            if (request.SocialLinks != null)
            {
                UpdateUserSettingsResult? linkOutcome = TryApplySocialLinks(user, request.SocialLinks, _settings);
                if (linkOutcome != null)
                    return linkOutcome;
            }

            if (imageUploads?.Profile == null && request.UnsetProfileImage)
            {
                if (!string.IsNullOrWhiteSpace(user.ProfileImageFileName))
                    await _profileMedia.DeleteBlobIfExistsAsync(user.ProfileImageFileName, ct);
                user.ProfileImageUrl = null;
                user.ProfileImageFileName = null;
            }

            if (imageUploads?.Banner == null && request.UnsetBannerImage)
            {
                if (!string.IsNullOrWhiteSpace(user.BannerImageFileName))
                    await _profileMedia.DeleteBlobIfExistsAsync(user.BannerImageFileName, ct);
                user.BannerImageUrl = null;
                user.BannerImageFileName = null;
            }

            if (imageUploads?.Profile != null)
            {
                var imgResult = await TryApplyProfileOrBannerImageAsync(user, imageUploads.Profile, banner: false, ct);
                if (imgResult != null)
                    return imgResult;
            }

            if (imageUploads?.Banner != null)
            {
                var imgResult = await TryApplyProfileOrBannerImageAsync(user, imageUploads.Banner, banner: true, ct);
                if (imgResult != null)
                    return imgResult;
            }

            try
            {
                await _repo.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex)
            {
                return MapDbUpdateException(ex);
            }

            return UpdateUserSettingsResult.Ok();
        }
        finally
        {
            if (imageUploads is not null)
                await imageUploads.DisposeAsync();
        }
    }

    private async Task<UpdateUserSettingsResult?> TryApplyProfileOrBannerImageAsync(
        AppUser user,
        MemoryStream buffer,
        bool banner,
        CancellationToken ct)
    {
        var uploadOpts = _settings.ProfileMediaUpload;
        if (buffer.Length <= 0)
            return UpdateUserSettingsResult.ValidationFailed(ErrInvalidImageContent);

        if (buffer.Length > uploadOpts.MaxImageBytes)
        {
            return UpdateUserSettingsResult.ValidationFailed(
                string.Format(ErrMediaFileTooLargeFormat, uploadOpts.MaxImageBytes));
        }

        buffer.Position = 0;
        if (!SocialImageFormatInspector.TryDetectImageMimeType(buffer, out string? detectedMime)
            || string.IsNullOrEmpty(detectedMime))
            return UpdateUserSettingsResult.ValidationFailed(ErrInvalidImageContent);

        bool allowedMime = uploadOpts.AllowedImageMimeTypes
            .Any(x => x.Equals(detectedMime, StringComparison.OrdinalIgnoreCase));
        if (!allowedMime)
            return UpdateUserSettingsResult.ValidationFailed(ErrUnsupportedImageMimeType);

        buffer.Position = 0;
        try
        {
            await using ProcessedProfileImage processed = banner
                ? await UserProfileImageProcessor.ProcessBannerAsync(buffer, uploadOpts, ct)
                : await UserProfileImageProcessor.ProcessProfileSquareAsync(buffer, uploadOpts, ct);

            string? oldBlob = banner ? user.BannerImageFileName : user.ProfileImageFileName;
            UserProfileMediaUploadResult uploaded = await _profileMedia.UploadProcessedImageAsync(
                processed.Stream,
                processed.ContentType,
                processed.ExtensionWithDot,
                ct);

            if (!string.IsNullOrWhiteSpace(oldBlob))
                await _profileMedia.DeleteBlobIfExistsAsync(oldBlob, ct);

            if (banner)
            {
                user.BannerImageUrl = uploaded.Url;
                user.BannerImageFileName = uploaded.BlobName;
            }
            else
            {
                user.ProfileImageUrl = uploaded.Url;
                user.ProfileImageFileName = uploaded.BlobName;
            }
        }
        catch (ArgumentException ex)
        {
            return UpdateUserSettingsResult.ValidationFailed(ex.Message);
        }
        catch (UnknownImageFormatException)
        {
            return UpdateUserSettingsResult.ValidationFailed(ErrInvalidImageContent);
        }
        catch (InvalidImageContentException)
        {
            return UpdateUserSettingsResult.ValidationFailed(ErrInvalidImageContent);
        }
        catch (ImageFormatException)
        {
            return UpdateUserSettingsResult.ValidationFailed(ErrInvalidImageContent);
        }
        catch (UserProfileMediaStorageException ex)
        {
            return UpdateUserSettingsResult.ValidationFailed(ex.Message);
        }

        return null;
    }

    private static UpdateUserSettingsResult MapDbUpdateException(DbUpdateException ex)
    {
        if (ex.InnerException is SqlException sql)
        {
            foreach (SqlError err in sql.Errors)
            {
                if (err.Number is 2601 or 2627)
                {
                    if (err.Message.Contains("IX_AppUsers_Handle", StringComparison.OrdinalIgnoreCase))
                        return UpdateUserSettingsResult.Conflict(ErrHandleInUse);

                    return UpdateUserSettingsResult.ValidationFailed(ErrUniqueConflict);
                }

                if (err.Number == 547)
                    return UpdateUserSettingsResult.ValidationFailed(ErrFkOrReference);
            }
        }

        return UpdateUserSettingsResult.ValidationFailed(ErrSaveGeneric);
    }

    private async Task<UpdateUserSettingsResult?> TryApplyLocationAsync(
        AppUser user,
        UserLocationSettingDto loc,
        CancellationToken ct)
    {
        int? cId = loc.CountryId;
        int? sId = loc.StateRegionId;
        int? cityId = loc.CityId;

        if (cityId.HasValue && !sId.HasValue)
            return UpdateUserSettingsResult.ValidationFailed(ErrLocationHierarchy);

        if (sId.HasValue && !cId.HasValue)
            return UpdateUserSettingsResult.ValidationFailed(ErrLocationHierarchy);

        if (!cId.HasValue && !sId.HasValue && !cityId.HasValue)
        {
            if (user.LocationCountryId != null || user.LocationStateRegionId != null || user.LocationCityId != null)
            {
                user.LocationCountryId = null;
                user.LocationStateRegionId = null;
                user.LocationCityId = null;
            }

            return null;
        }

        if (cId.HasValue && !await _repo.CountryExistsAsync(cId.Value, ct))
            return UpdateUserSettingsResult.ValidationFailed(ErrLocationUnknown);

        if (sId.HasValue)
        {
            if (!cId.HasValue)
                return UpdateUserSettingsResult.ValidationFailed(ErrLocationHierarchy);

            if (!await _repo.StateRegionExistsInCountryAsync(sId.Value, cId.Value, ct))
                return UpdateUserSettingsResult.ValidationFailed(ErrLocationUnknown);
        }

        if (cityId.HasValue)
        {
            if (!sId.HasValue)
                return UpdateUserSettingsResult.ValidationFailed(ErrLocationHierarchy);

            if (!await _repo.CityExistsInStateRegionAsync(cityId.Value, sId.Value, ct))
                return UpdateUserSettingsResult.ValidationFailed(ErrLocationUnknown);
        }

        int? newCountry = null;
        int? newState = null;
        int? newCity = null;

        if (cityId.HasValue)
        {
            newCity = cityId;
            newState = sId;
            newCountry = cId;
        }
        else if (sId.HasValue)
        {
            newState = sId;
            newCountry = cId;
        }
        else if (cId.HasValue)
        {
            newCountry = cId;
        }

        if (user.LocationCountryId != newCountry
            || user.LocationStateRegionId != newState
            || user.LocationCityId != newCity)
        {
            user.LocationCountryId = newCountry;
            user.LocationStateRegionId = newState;
            user.LocationCityId = newCity;
        }

        return null;
    }

    private static UpdateUserSettingsResult? TryApplySocialLinks(
        AppUser user,
        IReadOnlyList<UserSocialLinkSettingDto> links,
        UserSettingsOptions settings)
    {
        var seen = new HashSet<eSocialPlatform>();
        foreach (var item in links)
        {
            if (!seen.Add(item.Platform))
                return UpdateUserSettingsResult.ValidationFailed(ErrSocialDuplicatePlatform);

            if (!Enum.IsDefined(item.Platform))
                return UpdateUserSettingsResult.ValidationFailed(ErrSocialPlatformUnknown);

            string trimmed = item.LinkValue?.Trim() ?? string.Empty;
            if (trimmed.Length == 0)
                return UpdateUserSettingsResult.ValidationFailed(ErrSocialLinkInvalid);

            if (trimmed.Length > settings.MaxSocialLinkValueLength)
            {
                return UpdateUserSettingsResult.ValidationFailed(
                    string.Format(ErrSocialLinkTooLongFormat, settings.MaxSocialLinkValueLength));
            }

            if (!IsValidSocialLinkValue(trimmed))
                return UpdateUserSettingsResult.ValidationFailed(ErrSocialLinkInvalid);
        }

        var requestedPlatforms = links.Select(l => l.Platform).ToHashSet();

        foreach (var existing in user.SocialLinks)
        {
            if (!existing.IsActive)
                continue;

            if (!requestedPlatforms.Contains(existing.Platform))
                existing.IsActive = false;
        }

        foreach (var item in links)
        {
            var existing = user.SocialLinks.FirstOrDefault(x => x.Platform == item.Platform);
            string value = item.LinkValue!.Trim();
            if (existing == null)
            {
                user.SocialLinks.Add(
                    new AppUserSocialLink
                    {
                        Platform = item.Platform,
                        LinkValue = value,
                        IsVisible = item.IsVisible,
                        IsActive = true
                    });
            }
            else
            {
                if (!existing.IsActive)
                    existing.IsActive = true;

                if (!string.Equals(existing.LinkValue, value, StringComparison.Ordinal))
                    existing.LinkValue = value;

                if (existing.IsVisible != item.IsVisible)
                    existing.IsVisible = item.IsVisible;
            }
        }

        return null;
    }

    private static bool IsValidSocialLinkValue(string value)
    {
        if (value.Contains("://", StringComparison.Ordinal))
        {
            return Uri.TryCreate(value, UriKind.Absolute, out Uri? uri)
                   && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
        }

        return s_identifierChars.IsMatch(value);
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
