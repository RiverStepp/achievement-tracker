using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.Options;
using AchievementTracker.Api.Services.BusinessLogic;
using AchievementTracker.Api.Services.Interfaces;
using Microsoft.Extensions.Options;
using Moq;

namespace AchievementTracker.Tests.Services.BusinessLogic;

internal sealed class SocialServiceTestFixture(
    Mock<ISocialRepository> socialRepositoryMock,
    Mock<ISocialAttachmentStorageService> attachmentStorageMock,
    Mock<IAppUserRepository> appUserRepositoryMock,
    SocialOptions socialOptions)
{
    public Mock<ISocialRepository> SocialRepositoryMock { get; } = socialRepositoryMock;
    public Mock<ISocialAttachmentStorageService> AttachmentStorageMock { get; } = attachmentStorageMock;
    public Mock<IAppUserRepository> AppUserRepositoryMock { get; } = appUserRepositoryMock;
    public SocialOptions SocialOptions { get; } = socialOptions;
    public SocialService Service { get; private set; } = BuildService(
        socialRepositoryMock.Object,
        attachmentStorageMock.Object,
        appUserRepositoryMock.Object,
        socialOptions);

    public void RecreateService()
    {
        Service = BuildService(
            SocialRepositoryMock.Object,
            AttachmentStorageMock.Object,
            AppUserRepositoryMock.Object,
            SocialOptions);
    }

    private static SocialService BuildService(
        ISocialRepository socialRepository,
        ISocialAttachmentStorageService attachmentStorage,
        IAppUserRepository appUserRepository,
        SocialOptions socialOptions)
    {
        return new SocialService(
            socialRepository,
            attachmentStorage,
            appUserRepository,
            Options.Create(socialOptions));
    }
}
