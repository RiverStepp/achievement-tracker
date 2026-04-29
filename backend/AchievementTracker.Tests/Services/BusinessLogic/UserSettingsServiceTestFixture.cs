using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.Options;
using AchievementTracker.Api.Services.BusinessLogic;
using AchievementTracker.Api.Services.Interfaces;
using AchievementTracker.Data.Entities;
using Microsoft.Extensions.Options;
using Moq;

namespace AchievementTracker.Tests.Services.BusinessLogic;

internal sealed class UserSettingsServiceTestFixture(
    Mock<IUserSettingsRepository> userSettingsRepositoryMock,
    Mock<ILookupRepository> lookupRepositoryMock,
    Mock<IUserProfileMediaStorageService> profileMediaStorageMock,
    SocialOptions socialOptions,
    UserSettingsOptions userSettingsOptions)
{
    public Mock<IUserSettingsRepository> UserSettingsRepositoryMock { get; } = userSettingsRepositoryMock;
    public Mock<ILookupRepository> LookupRepositoryMock { get; } = lookupRepositoryMock;
    public Mock<IUserProfileMediaStorageService> ProfileMediaStorageMock { get; } = profileMediaStorageMock;
    public SocialOptions SocialOptions { get; } = socialOptions;
    public UserSettingsOptions UserSettingsOptions { get; } = userSettingsOptions;
    public AppUser User { get; } = new();

    public UserSettingsService Service { get; private set; } = BuildService(
        userSettingsRepositoryMock.Object,
        lookupRepositoryMock.Object,
        profileMediaStorageMock.Object,
        socialOptions,
        userSettingsOptions);

    public static UserSettingsServiceTestFixture Create()
    {
        var repo = new Mock<IUserSettingsRepository>();
        var lookups = new Mock<ILookupRepository>();
        var media = new Mock<IUserProfileMediaStorageService>();
        var socialOptions = new SocialOptions
        {
            MaxHandleLength = 15,
            MaxDisplayNameLength = 20
        };
        var settingsOptions = new UserSettingsOptions
        {
            MaxBioLength = 100,
            MaxSocialLinkValueLength = 50,
            ProfileMediaUpload = new UserProfileMediaUploadOptions
            {
                MaxImageBytes = 1024,
                MaxDecodeDimension = 2048,
                ProfileOutputSize = 64,
                BannerOutputWidth = 192,
                BannerOutputHeight = 64,
                JpegQuality = 85,
                AllowedImageMimeTypes = ["image/png"]
            }
        };

        var fixture = new UserSettingsServiceTestFixture(repo, lookups, media, socialOptions, settingsOptions);
        repo.Setup(x => x.GetTrackedUserForSettingsUpdateAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(fixture.User);
        repo.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return fixture;
    }

    private static UserSettingsService BuildService(
        IUserSettingsRepository userSettingsRepository,
        ILookupRepository lookupRepository,
        IUserProfileMediaStorageService profileMediaStorage,
        SocialOptions socialOptions,
        UserSettingsOptions userSettingsOptions)
    {
        return new UserSettingsService(
            userSettingsRepository,
            lookupRepository,
            profileMediaStorage,
            Options.Create(socialOptions),
            Options.Create(userSettingsOptions));
    }
}
