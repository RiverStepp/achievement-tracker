using System.Text.RegularExpressions;
using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.DTOs.Settings;
using AchievementTracker.Api.Models.Options;
using AchievementTracker.Api.Models.Responses.Settings;
using AchievementTracker.Api.Models.Results;
using AchievementTracker.Api.Services.Interfaces;
using AchievementTracker.Data.Entities;
using AchievementTracker.Data.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace AchievementTracker.Api.Services.BusinessLogic;

public sealed class UserSettingsService(
    IUserSettingsRepository userSettingsRepository,
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

    private static readonly Regex s_identifierChars = new(
        @"^[\w.@#+\-]+$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private readonly IUserSettingsRepository _repo = userSettingsRepository;
    private readonly SocialOptions _social = socialOptions.Value;
    private readonly UserSettingsOptions _settings = userSettingsOptions.Value;

    public Task<UserSettingsResponseDto?> GetSettingsAsync(int appUserId, CancellationToken ct = default)
    {
        return _repo.GetSettingsAsync(appUserId, ct);
    }

    public async Task<UpdateUserSettingsResult> UpdateSettingsAsync(
        int appUserId,
        UpdateMySettingsRequestDto request,
        CancellationToken ct = default)
    {
        var user = await _repo.GetTrackedUserForSettingsUpdateAsync(appUserId, ct);
        if (user == null)
            return UpdateUserSettingsResult.Failed("User was not found.");

        if (request.DisplayName != null)
        {
            string trimmed = request.DisplayName.Trim();
            if (trimmed.Length > _social.MaxDisplayNameLength)
            {
                return UpdateUserSettingsResult.Failed(
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
                    return UpdateUserSettingsResult.Failed(
                        string.Format(ErrHandleTooLongFormat, _social.MaxHandleLength));
                }

                if (!IsValidHandle(normalized, _social.MaxHandleLength))
                    return UpdateUserSettingsResult.Failed(ErrHandleInvalid);

                if (await _repo.HandleExistsAsync(normalized, appUserId, ct))
                    return UpdateUserSettingsResult.Failed(ErrHandleInUse);
            }

            if (!string.Equals(user.Handle, normalized, StringComparison.Ordinal))
                user.Handle = normalized;
        }

        if (request.Bio != null)
        {
            string trimmed = request.Bio.Trim();
            if (trimmed.Length > _settings.MaxBioLength)
            {
                return UpdateUserSettingsResult.Failed(
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
                return UpdateUserSettingsResult.Failed(ErrTimeZoneUnknown);

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
                return UpdateUserSettingsResult.Failed(ErrPronounUnknown);

            if (user.PronounOptionId != pId)
                user.PronounOptionId = pId;
        }

        if (request.SocialLinks != null)
        {
            UpdateUserSettingsResult? linkOutcome = TryApplySocialLinks(user, request.SocialLinks, _settings);
            if (linkOutcome != null)
                return linkOutcome;
        }

        try
        {
            await _repo.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            return UpdateUserSettingsResult.Failed(ErrHandleInUse);
        }

        return UpdateUserSettingsResult.Ok();
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
            return UpdateUserSettingsResult.Failed(ErrLocationHierarchy);

        if (sId.HasValue && !cId.HasValue)
            return UpdateUserSettingsResult.Failed(ErrLocationHierarchy);

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
            return UpdateUserSettingsResult.Failed(ErrLocationUnknown);

        if (sId.HasValue)
        {
            if (!cId.HasValue)
                return UpdateUserSettingsResult.Failed(ErrLocationHierarchy);

            if (!await _repo.StateRegionExistsInCountryAsync(sId.Value, cId.Value, ct))
                return UpdateUserSettingsResult.Failed(ErrLocationUnknown);
        }

        if (cityId.HasValue)
        {
            if (!sId.HasValue)
                return UpdateUserSettingsResult.Failed(ErrLocationHierarchy);

            if (!await _repo.CityExistsInStateRegionAsync(cityId.Value, sId.Value, ct))
                return UpdateUserSettingsResult.Failed(ErrLocationUnknown);
        }

        int? newCountry = null;
        int? newState = null;
        int? newCity = null;

        if (cityId.HasValue)
        {
            newCity = cityId;
        }
        else if (sId.HasValue)
        {
            newState = sId;
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
                return UpdateUserSettingsResult.Failed(ErrSocialDuplicatePlatform);

            if (!Enum.IsDefined(item.Platform))
                return UpdateUserSettingsResult.Failed(ErrSocialPlatformUnknown);

            string trimmed = item.LinkValue?.Trim() ?? string.Empty;
            if (trimmed.Length == 0)
                return UpdateUserSettingsResult.Failed(ErrSocialLinkInvalid);

            if (trimmed.Length > settings.MaxSocialLinkValueLength)
            {
                return UpdateUserSettingsResult.Failed(
                    string.Format(ErrSocialLinkTooLongFormat, settings.MaxSocialLinkValueLength));
            }

            if (!IsValidSocialLinkValue(trimmed))
                return UpdateUserSettingsResult.Failed(ErrSocialLinkInvalid);
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
