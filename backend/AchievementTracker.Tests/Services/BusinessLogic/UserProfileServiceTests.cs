using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.Options;
using AchievementTracker.Api.Models.Requests;
using AchievementTracker.Api.Models.Responses.Profile;
using AchievementTracker.Api.Services.BusinessLogic;
using Moq;

namespace AchievementTracker.Tests.Services.BusinessLogic;

[TestClass]
public sealed class UserProfileServiceTests
{
    private const int MaxPageSize = 100;

    [TestMethod]
    public async Task GetProfileAsync_PublicIdIsEmpty_ReturnsNull()
    {
        var fixture = CreateFixture();

        var result = await fixture.Service.GetProfileAsync(Guid.Empty, new GetUserProfileRequest());

        Assert.IsNull(result);
        fixture.AppUserRepositoryMock.Verify(x => x.GetSteamIdByPublicIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [TestMethod]
    public async Task GetProfileAsync_SteamIdNotFound_UsesBasicProfileRepositoryPath()
    {
        var fixture = CreateFixture();
        var publicId = Guid.NewGuid();
        var request = new GetUserProfileRequest();
        var expected = BuildProfileResponse(isClaimed: true);

        fixture.AppUserRepositoryMock
            .Setup(x => x.GetSteamIdByPublicIdAsync(publicId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((long?)null);
        fixture.UserProfileRepositoryMock
            .Setup(x => x.GetBasicProfileByPublicIdAsync(publicId, It.IsAny<GetUserProfileRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var result = await fixture.Service.GetProfileAsync(publicId, request);

        Assert.AreSame(expected, result);
        fixture.UserProfileRepositoryMock.Verify(
            x => x.GetBasicProfileByPublicIdAsync(publicId, It.IsAny<GetUserProfileRequest>(), It.IsAny<CancellationToken>()),
            Times.Once);
        fixture.UserProfileRepositoryMock.Verify(
            x => x.GetProfileAsync(It.IsAny<long>(), It.IsAny<GetUserProfileRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [TestMethod]
    public async Task GetProfileAsync_SteamIdFound_UsesSteamProfilePathWithNormalizedRequest()
    {
        var fixture = CreateFixture();
        var publicId = Guid.NewGuid();
        const long steamId = 76561198000000000;
        GetUserProfileRequest? capturedRequest = null;
        var expected = BuildProfileResponse(isClaimed: true);
        var request = new GetUserProfileRequest
        {
            GamesPageNumber = 0,
            GamesPageSize = 999,
            AchievementsPageNumber = 0,
            AchievementsPageSize = 999,
            AchievementsByPointsPageNumber = 0,
            AchievementsByPointsPageSize = 999,
            LatestActivityPageNumber = 0,
            LatestActivityPageSize = 999
        };

        fixture.AppUserRepositoryMock
            .Setup(x => x.GetSteamIdByPublicIdAsync(publicId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(steamId);
        fixture.UserProfileRepositoryMock
            .Setup(x => x.GetProfileAsync(steamId, It.IsAny<GetUserProfileRequest>(), It.IsAny<CancellationToken>()))
            .Callback<long, GetUserProfileRequest, CancellationToken>((_, normalized, _) => capturedRequest = normalized)
            .ReturnsAsync(expected);

        var result = await fixture.Service.GetProfileAsync(publicId, request);

        Assert.AreSame(expected, result);
        Assert.IsNotNull(capturedRequest);
        Assert.AreEqual(1, capturedRequest.GamesPageNumber);
        Assert.AreEqual(MaxPageSize, capturedRequest.GamesPageSize);
        Assert.AreEqual(1, capturedRequest.AchievementsPageNumber);
        Assert.AreEqual(MaxPageSize, capturedRequest.AchievementsPageSize);
        Assert.AreEqual(1, capturedRequest.AchievementsByPointsPageNumber);
        Assert.AreEqual(MaxPageSize, capturedRequest.AchievementsByPointsPageSize);
        Assert.AreEqual(1, capturedRequest.LatestActivityPageNumber);
        Assert.AreEqual(fixture.ProfileOptions.MaxLatestActivityPageSize, capturedRequest.LatestActivityPageSize);
    }

    [TestMethod]
    public async Task GetProfileBySteamIdAsync_SteamIdInvalid_ReturnsNull()
    {
        var fixture = CreateFixture();

        var result = await fixture.Service.GetProfileBySteamIdAsync(0, new GetUserProfileRequest());

        Assert.IsNull(result);
        fixture.UserProfileRepositoryMock.Verify(x => x.SteamProfileExistsAsync(It.IsAny<long>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [TestMethod]
    public async Task GetProfileBySteamIdAsync_SteamProfileMissing_ReturnsNull()
    {
        var fixture = CreateFixture();
        const long steamId = 76561198000000000;

        fixture.UserProfileRepositoryMock
            .Setup(x => x.SteamProfileExistsAsync(steamId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var result = await fixture.Service.GetProfileBySteamIdAsync(steamId, new GetUserProfileRequest());

        Assert.IsNull(result);
        fixture.UserProfileRepositoryMock.Verify(
            x => x.GetProfileAsync(It.IsAny<long>(), It.IsAny<GetUserProfileRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [TestMethod]
    public async Task GetProfileBySteamIdAsync_SteamProfileExists_ReturnsProfile()
    {
        var fixture = CreateFixture();
        const long steamId = 76561198000000000;
        var expected = BuildProfileResponse(isClaimed: false);

        fixture.UserProfileRepositoryMock
            .Setup(x => x.SteamProfileExistsAsync(steamId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        fixture.UserProfileRepositoryMock
            .Setup(x => x.GetProfileAsync(steamId, It.IsAny<GetUserProfileRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var result = await fixture.Service.GetProfileBySteamIdAsync(steamId, new GetUserProfileRequest());

        Assert.AreSame(expected, result);
    }

    [TestMethod]
    public async Task GetPublicIdByHandleAsync_HandleMissingAtPrefix_AddsPrefix()
    {
        var fixture = CreateFixture();
        var expected = Guid.NewGuid();

        fixture.AppUserRepositoryMock
            .Setup(x => x.GetPublicIdByHandleAsync("@river", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var result = await fixture.Service.GetPublicIdByHandleAsync("river");

        Assert.AreEqual(expected, result);
    }

    private static UserProfileServiceTestFixture CreateFixture()
    {
        var appUserRepositoryMock = new Mock<IAppUserRepository>(MockBehavior.Strict);
        var userProfileRepositoryMock = new Mock<IUserProfileRepository>(MockBehavior.Strict);
        var options = new ProfileOptions
        {
            GamesPageSize = 25,
            AchievementsPageSize = 100,
            AchievementsByPointsPageSize = 100,
            LatestActivityPageSize = 25,
            MaxLatestActivityPageSize = 75,
            MaxPinnedAchievements = 10,
            PinnedAchievementDisplayOrderStep = 100
        };

        return new UserProfileServiceTestFixture(appUserRepositoryMock, userProfileRepositoryMock, options);
    }

    private static UserProfileResponse BuildProfileResponse(bool isClaimed)
    {
        return new UserProfileResponse(
            null,
            [],
            null,
            new UserTotalsDto(0, 0, 0, 0, 0, 0, null),
            new PagedResultDto<ProfileGameItemDto>(1, 1, 0, []),
            new PagedResultDto<ProfileAchievementItemDto>(1, 1, 0, []),
            new PagedResultDto<ProfileAchievementItemDto>(1, 1, 0, []),
            [],
            new PagedResultDto<ProfileLatestActivityItemDto>(1, 1, 0, []),
            isClaimed);
    }
}
