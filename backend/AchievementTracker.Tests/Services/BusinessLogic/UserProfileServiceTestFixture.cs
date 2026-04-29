using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.Options;
using AchievementTracker.Api.Services.BusinessLogic;
using Microsoft.Extensions.Options;
using Moq;

namespace AchievementTracker.Tests.Services.BusinessLogic;

internal sealed class UserProfileServiceTestFixture(
    Mock<IAppUserRepository> appUserRepositoryMock,
    Mock<IUserProfileRepository> userProfileRepositoryMock,
    ProfileOptions profileOptions)
{
    public Mock<IAppUserRepository> AppUserRepositoryMock { get; } = appUserRepositoryMock;
    public Mock<IUserProfileRepository> UserProfileRepositoryMock { get; } = userProfileRepositoryMock;
    public ProfileOptions ProfileOptions { get; } = profileOptions;
    public UserProfileService Service { get; } = new(
        appUserRepositoryMock.Object,
        userProfileRepositoryMock.Object,
        Options.Create(profileOptions));
}
