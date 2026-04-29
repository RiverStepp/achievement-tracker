using AchievementTracker.Api.Models.DTOs.Settings;
using AchievementTracker.Api.Models.Responses.Settings;
using AchievementTracker.Api.Models.Results;
using AchievementTracker.Api.Services.BusinessLogic;
using AchievementTracker.Api.Services.Interfaces;
using AchievementTracker.Data.Entities;
using AchievementTracker.Data.Enums;
using Moq;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;

namespace AchievementTracker.Tests.Services.BusinessLogic;

[TestClass]
public sealed class UserSettingsServiceTests
{
    private const string ValidationPrefix = "validation:";

    [TestMethod]
    public async Task GetSettingsAsync_UserNotFound_ReturnsNull()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        fixture.UserSettingsRepositoryMock
            .Setup(x => x.GetUserSettingsValuesAsync(42, It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserSettingsValuesDto?)null);

        var result = await fixture.Service.GetSettingsAsync(42);

        Assert.IsNull(result);
    }

    [TestMethod]
    public async Task GetSettingsAsync_UserFound_MapsAllFields()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        UserSettingsValuesDto values = new(
            DisplayName: "Display",
            Handle: "@handle",
            Bio: "Bio",
            Location: new UserSettingsLocationResponseDto(1, "USA", 2, "WA", 3, "Seattle"),
            TimeZone: new UserSettingsTimeZoneResponseDto(9, "America/Los_Angeles", "Pacific"),
            Pronouns: new UserSettingsPronounResponseDto(3, "she_her", "She/Her"),
            SocialLinks: [new UserSettingsSocialLinkResponseDto(eSocialPlatform.Discord, "discordUser", true)],
            ProfileImage: new UserSettingsMediaAssetDto("profile.png", "https://img/profile.png"),
            BannerImage: new UserSettingsMediaAssetDto("banner.png", "https://img/banner.png"));
        IReadOnlyList<LocationCountryOptionDto> countries = [new(1, "US", "United States")];
        IReadOnlyList<IanaTimeZoneOptionDto> zones = [new(9, "America/Los_Angeles", "Pacific")];
        IReadOnlyList<PronounOptionItemDto> pronouns = [new(3, "she_her", "She/Her")];
        fixture.UserSettingsRepositoryMock
            .Setup(x => x.GetUserSettingsValuesAsync(7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(values);
        fixture.LookupRepositoryMock
            .Setup(x => x.GetCountriesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(countries);
        fixture.LookupRepositoryMock
            .Setup(x => x.GetIanaTimeZonesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(zones);
        fixture.LookupRepositoryMock
            .Setup(x => x.GetPronounOptionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(pronouns);

        var result = await fixture.Service.GetSettingsAsync(7);

        Assert.IsNotNull(result);
        Assert.AreEqual(values.DisplayName, result.DisplayName);
        Assert.AreEqual(values.Handle, result.Handle);
        Assert.AreEqual(values.Bio, result.Bio);
        Assert.AreEqual(values.Location, result.Location);
        Assert.AreEqual(values.TimeZone, result.TimeZone);
        Assert.AreEqual(values.Pronouns, result.Pronouns);
        Assert.AreSame(values.SocialLinks, result.SocialLinks);
        Assert.AreEqual(values.ProfileImage, result.ProfileImage);
        Assert.AreEqual(values.BannerImage, result.BannerImage);
        Assert.AreSame(countries, result.Countries);
        Assert.AreSame(zones, result.IanaTimeZones);
        Assert.AreSame(pronouns, result.PronounOptions);
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_UserNotFound_ReturnsNotFound()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        fixture.UserSettingsRepositoryMock
            .Setup(x => x.GetTrackedUserForSettingsUpdateAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AppUser?)null);

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto());

        AssertResult(result, false, UpdateUserSettingsFailureKind.NotFound, "User was not found.");
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_DisplayNameTooLong_ReturnsValidation()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        string tooLong = new('d', fixture.SocialOptions.MaxDisplayNameLength + 1);

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto { DisplayName = tooLong });

        AssertResult(result, false, UpdateUserSettingsFailureKind.Validation, $"Display name must be {fixture.SocialOptions.MaxDisplayNameLength} characters or fewer.");
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_DisplayNameWhitespace_ClearsDisplayName()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        fixture.User.DisplayName = "Existing";

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto { DisplayName = "   " });

        AssertResult(result, true, null, null);
        Assert.IsNull(fixture.User.DisplayName);
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_HandleTooLong_ReturnsValidation()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        string tooLong = "@" + new string('h', fixture.SocialOptions.MaxHandleLength);

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto { Handle = tooLong });

        AssertResult(result, false, UpdateUserSettingsFailureKind.Validation, $"Handle must be {fixture.SocialOptions.MaxHandleLength} characters or fewer.");
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_HandleInvalid_ReturnsValidation()
    {
        var fixture = UserSettingsServiceTestFixture.Create();

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto { Handle = "handle" });

        AssertResult(result, false, UpdateUserSettingsFailureKind.Validation, "Handle must start with @ and only contain letters, numbers, or underscore.");
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_HandleAlreadyInUse_ReturnsConflict()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        fixture.UserSettingsRepositoryMock
            .Setup(x => x.HandleExistsAsync("@taken", 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto { Handle = "@taken" });

        AssertResult(result, false, UpdateUserSettingsFailureKind.Conflict, "Handle is already in use.");
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_ValidHandle_UpdatesUserHandle()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        fixture.User.Handle = "@old";

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto { Handle = "@new_name1" });

        AssertResult(result, true, null, null);
        Assert.AreEqual("@new_name1", fixture.User.Handle);
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_BioTooLong_ReturnsValidation()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        string tooLong = new('b', fixture.UserSettingsOptions.MaxBioLength + 1);

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto { Bio = tooLong });

        AssertResult(result, false, UpdateUserSettingsFailureKind.Validation, $"Bio must be {fixture.UserSettingsOptions.MaxBioLength} characters or fewer.");
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_BioWhitespace_ClearsBio()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        fixture.User.Bio = "old";

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto { Bio = " " });

        AssertResult(result, true, null, null);
        Assert.IsNull(fixture.User.Bio);
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_UnsetLocation_ClearsLocationIds()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        fixture.User.LocationCountryId = 1;
        fixture.User.LocationStateRegionId = 2;
        fixture.User.LocationCityId = 3;

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto { UnsetLocation = true });

        AssertResult(result, true, null, null);
        Assert.IsNull(fixture.User.LocationCountryId);
        Assert.IsNull(fixture.User.LocationStateRegionId);
        Assert.IsNull(fixture.User.LocationCityId);
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_LocationCityWithoutState_ReturnsValidation()
    {
        var fixture = UserSettingsServiceTestFixture.Create();

        var result = await fixture.Service.UpdateSettingsAsync(
            1,
            new UpdateMySettingsRequestDto
            {
                Location = new UserLocationSettingDto { CountryId = 1, CityId = 9 }
            });

        AssertResult(result, false, UpdateUserSettingsFailureKind.Validation, "Location must include country before state, and state before city.");
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_LocationStateWithoutCountry_ReturnsValidation()
    {
        var fixture = UserSettingsServiceTestFixture.Create();

        var result = await fixture.Service.UpdateSettingsAsync(
            1,
            new UpdateMySettingsRequestDto
            {
                Location = new UserLocationSettingDto { StateRegionId = 2 }
            });

        AssertResult(result, false, UpdateUserSettingsFailureKind.Validation, "Location must include country before state, and state before city.");
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_LocationCountryUnknown_ReturnsValidation()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        fixture.UserSettingsRepositoryMock
            .Setup(x => x.CountryExistsAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var result = await fixture.Service.UpdateSettingsAsync(
            1,
            new UpdateMySettingsRequestDto
            {
                Location = new UserLocationSettingDto { CountryId = 1 }
            });

        AssertResult(result, false, UpdateUserSettingsFailureKind.Validation, "The selected location is not valid.");
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_LocationStateNotInCountry_ReturnsValidation()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        fixture.UserSettingsRepositoryMock
            .Setup(x => x.CountryExistsAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        fixture.UserSettingsRepositoryMock
            .Setup(x => x.StateRegionExistsInCountryAsync(2, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var result = await fixture.Service.UpdateSettingsAsync(
            1,
            new UpdateMySettingsRequestDto
            {
                Location = new UserLocationSettingDto { CountryId = 1, StateRegionId = 2 }
            });

        AssertResult(result, false, UpdateUserSettingsFailureKind.Validation, "The selected location is not valid.");
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_LocationCityNotInState_ReturnsValidation()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        fixture.UserSettingsRepositoryMock
            .Setup(x => x.CountryExistsAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        fixture.UserSettingsRepositoryMock
            .Setup(x => x.StateRegionExistsInCountryAsync(2, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        fixture.UserSettingsRepositoryMock
            .Setup(x => x.CityExistsInStateRegionAsync(3, 2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var result = await fixture.Service.UpdateSettingsAsync(
            1,
            new UpdateMySettingsRequestDto
            {
                Location = new UserLocationSettingDto { CountryId = 1, StateRegionId = 2, CityId = 3 }
            });

        AssertResult(result, false, UpdateUserSettingsFailureKind.Validation, "The selected location is not valid.");
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_LocationValidCityHierarchy_UpdatesAllLocationIds()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        fixture.UserSettingsRepositoryMock.Setup(x => x.CountryExistsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        fixture.UserSettingsRepositoryMock.Setup(x => x.StateRegionExistsInCountryAsync(2, 1, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        fixture.UserSettingsRepositoryMock.Setup(x => x.CityExistsInStateRegionAsync(3, 2, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await fixture.Service.UpdateSettingsAsync(
            1,
            new UpdateMySettingsRequestDto
            {
                Location = new UserLocationSettingDto { CountryId = 1, StateRegionId = 2, CityId = 3 }
            });

        AssertResult(result, true, null, null);
        Assert.AreEqual(1, fixture.User.LocationCountryId);
        Assert.AreEqual(2, fixture.User.LocationStateRegionId);
        Assert.AreEqual(3, fixture.User.LocationCityId);
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_UnsetTimeZone_ClearsTimeZone()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        fixture.User.IanaTimeZoneId = 10;

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto { UnsetTimeZone = true });

        AssertResult(result, true, null, null);
        Assert.IsNull(fixture.User.IanaTimeZoneId);
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_TimeZoneUnknown_ReturnsValidation()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        fixture.UserSettingsRepositoryMock
            .Setup(x => x.IanaTimeZoneExistsAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto { IanaTimeZoneId = 10 });

        AssertResult(result, false, UpdateUserSettingsFailureKind.Validation, "The selected time zone is not valid.");
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_ValidTimeZone_UpdatesTimeZone()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        fixture.UserSettingsRepositoryMock
            .Setup(x => x.IanaTimeZoneExistsAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto { IanaTimeZoneId = 10 });

        AssertResult(result, true, null, null);
        Assert.AreEqual(10, fixture.User.IanaTimeZoneId);
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_UnsetPronouns_ClearsPronouns()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        fixture.User.PronounOptionId = 4;

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto { UnsetPronouns = true });

        AssertResult(result, true, null, null);
        Assert.IsNull(fixture.User.PronounOptionId);
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_PronounsUnknown_ReturnsValidation()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        fixture.UserSettingsRepositoryMock
            .Setup(x => x.PronounOptionExistsAsync(4, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto { PronounOptionId = 4 });

        AssertResult(result, false, UpdateUserSettingsFailureKind.Validation, "The selected pronouns option is not valid.");
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_SocialLinksDuplicatePlatform_ReturnsValidation()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        IReadOnlyList<UserSocialLinkSettingDto> links =
        [
            new() { Platform = eSocialPlatform.Discord, LinkValue = "one", IsVisible = true },
            new() { Platform = eSocialPlatform.Discord, LinkValue = "two", IsVisible = false }
        ];

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto { SocialLinks = links });

        AssertResult(result, false, UpdateUserSettingsFailureKind.Validation, "Each social platform may appear only once.");
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_SocialLinkEmptyValue_ReturnsValidation()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        IReadOnlyList<UserSocialLinkSettingDto> links =
        [
            new() { Platform = eSocialPlatform.Discord, LinkValue = "  ", IsVisible = true }
        ];

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto { SocialLinks = links });

        AssertResult(result, false, UpdateUserSettingsFailureKind.Validation, "Social link value is not a valid URL or identifier.");
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_SocialLinkTooLong_ReturnsValidation()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        IReadOnlyList<UserSocialLinkSettingDto> links =
        [
            new()
            {
                Platform = eSocialPlatform.Discord,
                LinkValue = new string('x', fixture.UserSettingsOptions.MaxSocialLinkValueLength + 1),
                IsVisible = true
            }
        ];

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto { SocialLinks = links });

        AssertResult(result, false, UpdateUserSettingsFailureKind.Validation, $"Social link value must be {fixture.UserSettingsOptions.MaxSocialLinkValueLength} characters or fewer.");
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_SocialLinkInvalidIdentifier_ReturnsValidation()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        IReadOnlyList<UserSocialLinkSettingDto> links =
        [
            new() { Platform = eSocialPlatform.Discord, LinkValue = "bad value with spaces", IsVisible = true }
        ];

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto { SocialLinks = links });

        AssertResult(result, false, UpdateUserSettingsFailureKind.Validation, "Social link value is not a valid URL or identifier.");
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_SocialLinksValid_UpdatesAndDeactivatesMissingLinks()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        fixture.User.SocialLinks =
        [
            new AppUserSocialLink
            {
                Platform = eSocialPlatform.YouTube,
                LinkValue = "ytold",
                IsVisible = true,
                IsActive = true
            },
            new AppUserSocialLink
            {
                Platform = eSocialPlatform.Discord,
                LinkValue = "discold",
                IsVisible = false,
                IsActive = true
            }
        ];
        IReadOnlyList<UserSocialLinkSettingDto> links =
        [
            new() { Platform = eSocialPlatform.Discord, LinkValue = " discnew ", IsVisible = true },
            new() { Platform = eSocialPlatform.Twitch, LinkValue = "https://twitch.tv/test", IsVisible = false }
        ];

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto { SocialLinks = links });

        AssertResult(result, true, null, null);
        var youtube = fixture.User.SocialLinks.Single(x => x.Platform == eSocialPlatform.YouTube);
        var discord = fixture.User.SocialLinks.Single(x => x.Platform == eSocialPlatform.Discord);
        var twitch = fixture.User.SocialLinks.Single(x => x.Platform == eSocialPlatform.Twitch);
        Assert.IsFalse(youtube.IsActive);
        Assert.IsTrue(discord.IsActive);
        Assert.AreEqual("discnew", discord.LinkValue);
        Assert.IsTrue(discord.IsVisible);
        Assert.AreEqual("https://twitch.tv/test", twitch.LinkValue);
        Assert.IsTrue(twitch.IsActive);
        Assert.IsFalse(twitch.IsVisible);
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_UnsetProfileImageWithoutUpload_DeletesOldBlobAndClearsFields()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        fixture.User.ProfileImageFileName = "old-profile.png";
        fixture.User.ProfileImageUrl = "https://old";

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto { UnsetProfileImage = true });

        AssertResult(result, true, null, null);
        Assert.IsNull(fixture.User.ProfileImageFileName);
        Assert.IsNull(fixture.User.ProfileImageUrl);
        fixture.ProfileMediaStorageMock.Verify(x => x.DeleteBlobIfExistsAsync("old-profile.png", It.IsAny<CancellationToken>()), Times.Once);
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_UnsetBannerImageWithoutUpload_DeletesOldBlobAndClearsFields()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        fixture.User.BannerImageFileName = "old-banner.png";
        fixture.User.BannerImageUrl = "https://old";

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto { UnsetBannerImage = true });

        AssertResult(result, true, null, null);
        Assert.IsNull(fixture.User.BannerImageFileName);
        Assert.IsNull(fixture.User.BannerImageUrl);
        fixture.ProfileMediaStorageMock.Verify(x => x.DeleteBlobIfExistsAsync("old-banner.png", It.IsAny<CancellationToken>()), Times.Once);
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_ProfileUploadEmptyBuffer_ReturnsValidation()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        var uploads = new UserSettingsImageUploads { Profile = new MemoryStream() };

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto(), uploads);

        AssertResult(result, false, UpdateUserSettingsFailureKind.Validation, "File is not a recognized image format.");
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_ProfileUploadTooLarge_ReturnsValidation()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        var uploads = new UserSettingsImageUploads
        {
            Profile = new MemoryStream(new byte[fixture.UserSettingsOptions.ProfileMediaUpload.MaxImageBytes + 1])
        };

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto(), uploads);

        AssertResult(result, false, UpdateUserSettingsFailureKind.Validation, $"Image must be {fixture.UserSettingsOptions.ProfileMediaUpload.MaxImageBytes} bytes or smaller.");
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_ProfileUploadInvalidMime_ReturnsValidation()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        var uploads = new UserSettingsImageUploads
        {
            Profile = new MemoryStream([0xFF, 0xD8, 0xFF, 0xAA])
        };

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto(), uploads);

        AssertResult(result, false, UpdateUserSettingsFailureKind.Validation, "Unsupported image MIME type.");
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_ProfileUploadStorageThrows_ReturnsValidationWithStorageMessage()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        var uploads = new UserSettingsImageUploads
        {
            Profile = new MemoryStream(CreateOneByOnePngBytes())
        };
        fixture.ProfileMediaStorageMock
            .Setup(x => x.UploadProcessedImageAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new UserProfileMediaStorageException("storage failure"));

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto(), uploads);

        AssertResult(result, false, UpdateUserSettingsFailureKind.Validation, "storage failure");
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_ProfileUploadValid_UpdatesProfileImageFields()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        fixture.User.ProfileImageFileName = "old-profile.png";
        var uploads = new UserSettingsImageUploads
        {
            Profile = new MemoryStream(CreateOneByOnePngBytes())
        };
        fixture.ProfileMediaStorageMock
            .Setup(x => x.UploadProcessedImageAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserProfileMediaUploadResult("https://new/profile.png", "new-profile.png"));

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto(), uploads);

        AssertResult(result, true, null, null);
        Assert.AreEqual("new-profile.png", fixture.User.ProfileImageFileName);
        Assert.AreEqual("https://new/profile.png", fixture.User.ProfileImageUrl);
        fixture.ProfileMediaStorageMock.Verify(x => x.DeleteBlobIfExistsAsync("old-profile.png", It.IsAny<CancellationToken>()), Times.Once);
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_SaveChangesThrowsDbUpdateException_ReturnsValidationGeneric()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        fixture.UserSettingsRepositoryMock
            .Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Microsoft.EntityFrameworkCore.DbUpdateException("boom"));

        var result = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto { DisplayName = "ok" });

        AssertResult(result, false, UpdateUserSettingsFailureKind.Validation, "Could not save settings. Please try again.");
    }

    [TestMethod]
    public async Task UpdateSettingsAsync_ImageUploadsProvided_DisposesStreamsInFinally()
    {
        var fixture = UserSettingsServiceTestFixture.Create();
        var profile = new MemoryStream([1, 2, 3]);
        var banner = new MemoryStream([4, 5, 6]);
        var uploads = new UserSettingsImageUploads { Profile = profile, Banner = banner };

        _ = await fixture.Service.UpdateSettingsAsync(1, new UpdateMySettingsRequestDto(), uploads);

        Assert.ThrowsException<ObjectDisposedException>(() => _ = profile.Length);
        Assert.ThrowsException<ObjectDisposedException>(() => _ = banner.Length);
    }

    private static void AssertResult(
        UpdateUserSettingsResult result,
        bool expectedSuccess,
        UpdateUserSettingsFailureKind? expectedFailureKind,
        string? expectedMessage)
    {
        Assert.AreEqual(expectedSuccess, result.Success, ValidationPrefix + "success");
        Assert.AreEqual(expectedFailureKind, result.FailureKind, ValidationPrefix + "kind");
        Assert.AreEqual(expectedMessage, result.ErrorMessage, ValidationPrefix + "message");
    }

    private static byte[] CreateOneByOnePngBytes()
    {
        using Image<Rgba32> image = new(1, 1);
        using MemoryStream stream = new();
        image.SaveAsPng(stream);
        return stream.ToArray();
    }
}
