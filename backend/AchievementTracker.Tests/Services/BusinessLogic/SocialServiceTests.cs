using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.DTOs.Social;
using AchievementTracker.Api.Models.Options;
using AchievementTracker.Api.Services.BusinessLogic;
using AchievementTracker.Api.Services.Interfaces;
using AchievementTracker.Data.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Moq;

namespace AchievementTracker.Tests.Services.BusinessLogic;

[TestClass]
public sealed class SocialServiceTests
{
    private const int DefaultFeedPageSize = 20;
    private const int MaxFeedPageSize = 50;
    private const int DefaultCommentsPageSize = 10;
    private const int MaxCommentsPageSize = 30;
    private const int MaxRefreshIntervalSeconds = 120;
    private const int MaxAttachmentCount = 2;
    private const int MaxContentLength = 20;
    private const int MaxAttachmentUrlLength = 40;
    private const long MaxImageBytes = 1024;

    [TestMethod]
    public async Task GetFeedAsync_PageSizeLessThanOrEqualToZero_UsesDefaultPageSize()
    {
        var fixture = CreateFixture();
        var expected = new SocialFeedPageDto { HasMore = false };
        fixture.SocialRepositoryMock
            .Setup(x => x.GetFeedAsync(5, DefaultFeedPageSize, "token", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var result = await fixture.Service.GetFeedAsync(5, 0, "token");

        Assert.AreSame(expected, result);
    }

    [TestMethod]
    public async Task GetFeedAsync_PageSizeGreaterThanMax_UsesMaxPageSize()
    {
        var fixture = CreateFixture();
        var expected = new SocialFeedPageDto { HasMore = true };
        fixture.SocialRepositoryMock
            .Setup(x => x.GetFeedAsync(null, MaxFeedPageSize, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var result = await fixture.Service.GetFeedAsync(null, MaxFeedPageSize + 1, null);

        Assert.AreSame(expected, result);
    }

    [TestMethod]
    public async Task GetFeedByUserAsync_PageSizeWithinRange_UsesProvidedPageSize()
    {
        var fixture = CreateFixture();
        var authorPublicId = Guid.NewGuid();
        var expected = new SocialFeedPageDto { NextPageToken = "next" };
        const int requestedPageSize = 7;
        fixture.SocialRepositoryMock
            .Setup(x => x.GetFeedByAuthorPublicIdAsync(3, authorPublicId, requestedPageSize, "abc", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var result = await fixture.Service.GetFeedByUserAsync(3, authorPublicId, requestedPageSize, "abc");

        Assert.AreSame(expected, result);
    }

    [TestMethod]
    public async Task GetFeedRefreshAsync_PageSizeGreaterThanMax_UsesMaxPageSize()
    {
        var fixture = CreateFixture();
        var expected = new SocialFeedPageDto { HasMore = false };
        fixture.SocialRepositoryMock
            .Setup(x => x.GetFeedSinceAsync(2, It.IsAny<DateTime>(), MaxFeedPageSize, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var result = await fixture.Service.GetFeedRefreshAsync(2, 2, MaxFeedPageSize + 10);

        Assert.AreSame(expected, result);
    }

    [TestMethod]
    public async Task GetFeedRefreshAsync_IntervalSecondsLessThanOrEqualToZero_ThrowsArgumentOutOfRangeException()
    {
        var fixture = CreateFixture();

        await Assert.ThrowsExceptionAsync<ArgumentOutOfRangeException>(
            () => fixture.Service.GetFeedRefreshAsync(1, 0, 5));
    }

    [TestMethod]
    public async Task GetFeedRefreshAsync_IntervalSecondsGreaterThanMax_ThrowsArgumentOutOfRangeException()
    {
        var fixture = CreateFixture();

        await Assert.ThrowsExceptionAsync<ArgumentOutOfRangeException>(
            () => fixture.Service.GetFeedRefreshAsync(1, MaxRefreshIntervalSeconds + 1, 5));
    }

    [TestMethod]
    public async Task GetFeedRefreshAsync_ValidRequest_UsesSinceTimeAndNormalizedPageSize()
    {
        var fixture = CreateFixture();
        DateTime beforeCall = DateTime.UtcNow;
        DateTime capturedSince = DateTime.MinValue;
        var expected = new SocialFeedPageDto { HasMore = true };
        fixture.SocialRepositoryMock
            .Setup(x => x.GetFeedSinceAsync(4, It.IsAny<DateTime>(), DefaultFeedPageSize, It.IsAny<CancellationToken>()))
            .Callback<int?, DateTime, int, CancellationToken>((_, sinceUtc, _, _) => capturedSince = sinceUtc)
            .ReturnsAsync(expected);

        var result = await fixture.Service.GetFeedRefreshAsync(4, 3, 0);
        DateTime afterCall = DateTime.UtcNow;

        Assert.AreSame(expected, result);
        Assert.IsTrue(capturedSince >= beforeCall.AddSeconds(-3).AddMilliseconds(-250));
        Assert.IsTrue(capturedSince <= afterCall.AddSeconds(-3).AddMilliseconds(250));
    }

    [TestMethod]
    public async Task CreatePostAsync_IdentityIncomplete_ThrowsSocialIdentityRequiredException()
    {
        var fixture = CreateFixture(hasIdentity: false);

        await Assert.ThrowsExceptionAsync<SocialIdentityRequiredException>(
            () => fixture.Service.CreatePostAsync(1, new CreateSocialPostRequestDto { Content = "Hello" }));
    }

    [TestMethod]
    public async Task CreatePostAsync_ContentTooLong_ThrowsArgumentException()
    {
        var fixture = CreateFixture();
        string tooLongContent = new string('x', MaxContentLength + 1);

        await Assert.ThrowsExceptionAsync<ArgumentException>(
            () => fixture.Service.CreatePostAsync(1, new CreateSocialPostRequestDto { Content = tooLongContent }));
    }

    [TestMethod]
    public async Task CreatePostAsync_AttachmentCountExceedsMax_ThrowsArgumentException()
    {
        var fixture = CreateFixture();
        var request = new CreateSocialPostRequestDto
        {
            Content = "ok",
            Attachments =
            [
                CreateImageAttachment("https://example.com/1"),
                CreateImageAttachment("https://example.com/2"),
                CreateImageAttachment("https://example.com/3")
            ]
        };

        await Assert.ThrowsExceptionAsync<ArgumentException>(() => fixture.Service.CreatePostAsync(1, request));
    }

    [TestMethod]
    public async Task CreatePostAsync_ContentAndAttachmentsMissing_ThrowsArgumentException()
    {
        var fixture = CreateFixture();

        await Assert.ThrowsExceptionAsync<ArgumentException>(
            () => fixture.Service.CreatePostAsync(1, new CreateSocialPostRequestDto { Content = " " }));
    }

    [TestMethod]
    public async Task CreatePostAsync_AttachmentTypeNotDefined_ThrowsArgumentException()
    {
        var fixture = CreateFixture();
        var request = new CreateSocialPostRequestDto
        {
            Attachments = [new CreateSocialPostAttachmentDto { AttachmentType = (eAttachmentType)999, Url = "https://example.com" }]
        };

        await Assert.ThrowsExceptionAsync<ArgumentException>(() => fixture.Service.CreatePostAsync(1, request));
    }

    [TestMethod]
    public async Task CreatePostAsync_AttachmentUrlWhitespace_ThrowsArgumentException()
    {
        var fixture = CreateFixture();
        var request = new CreateSocialPostRequestDto
        {
            Attachments = [new CreateSocialPostAttachmentDto { AttachmentType = eAttachmentType.Image, Url = " " }]
        };

        await Assert.ThrowsExceptionAsync<ArgumentException>(() => fixture.Service.CreatePostAsync(1, request));
    }

    [TestMethod]
    public async Task CreatePostAsync_AttachmentUrlTooLong_ThrowsArgumentException()
    {
        var fixture = CreateFixture();
        string longUrl = "https://example.com/" + new string('a', MaxAttachmentUrlLength);
        var request = new CreateSocialPostRequestDto
        {
            Attachments = [new CreateSocialPostAttachmentDto { AttachmentType = eAttachmentType.Image, Url = longUrl }]
        };

        await Assert.ThrowsExceptionAsync<ArgumentException>(() => fixture.Service.CreatePostAsync(1, request));
    }

    [TestMethod]
    public async Task CreatePostAsync_AttachmentCaptionTooLong_ThrowsArgumentException()
    {
        var fixture = CreateFixture();
        var request = new CreateSocialPostRequestDto
        {
            Attachments =
            [
                new CreateSocialPostAttachmentDto
                {
                    AttachmentType = eAttachmentType.Image,
                    Url = "https://example.com",
                    Caption = new string('c', MaxContentLength + 1)
                }
            ]
        };

        await Assert.ThrowsExceptionAsync<ArgumentException>(() => fixture.Service.CreatePostAsync(1, request));
    }

    [TestMethod]
    public async Task CreatePostAsync_AttachmentUrlIsDataUrl_ThrowsArgumentException()
    {
        var fixture = CreateFixture();
        var request = new CreateSocialPostRequestDto
        {
            Attachments = [CreateImageAttachment("data:image/png;base64,abc")]
        };

        await Assert.ThrowsExceptionAsync<ArgumentException>(() => fixture.Service.CreatePostAsync(1, request));
    }

    [TestMethod]
    public async Task CreatePostAsync_AttachmentUrlNotHttpOrHttps_ThrowsArgumentException()
    {
        var fixture = CreateFixture();
        var request = new CreateSocialPostRequestDto
        {
            Attachments = [CreateImageAttachment("ftp://example.com/file.png")]
        };

        await Assert.ThrowsExceptionAsync<ArgumentException>(() => fixture.Service.CreatePostAsync(1, request));
    }

    [TestMethod]
    public async Task CreatePostAsync_AttachmentTypeUnsupported_ThrowsArgumentException()
    {
        var fixture = CreateFixture();
        var request = new CreateSocialPostRequestDto
        {
            Attachments = [new CreateSocialPostAttachmentDto { AttachmentType = (eAttachmentType)3, Url = "https://example.com" }]
        };

        await Assert.ThrowsExceptionAsync<ArgumentException>(() => fixture.Service.CreatePostAsync(1, request));
    }

    [TestMethod]
    public async Task CreatePostAsync_ValidRequest_NormalizesContentAndAttachments()
    {
        var fixture = CreateFixture();
        Guid expectedId = Guid.NewGuid();
        string? capturedContent = null;
        IReadOnlyList<CreateSocialPostAttachmentDto>? capturedAttachments = null;
        var request = new CreateSocialPostRequestDto
        {
            Content = "  hello  ",
            Attachments =
            [
                new CreateSocialPostAttachmentDto
                {
                    AttachmentType = eAttachmentType.Image,
                    Url = "  https://example.com/img.png  ",
                    Caption = "  caption  "
                }
            ]
        };
        fixture.SocialRepositoryMock
            .Setup(x => x.CreatePostAsync(9, It.IsAny<string?>(), It.IsAny<IReadOnlyList<CreateSocialPostAttachmentDto>>(), It.IsAny<CancellationToken>()))
            .Callback<int, string?, IReadOnlyList<CreateSocialPostAttachmentDto>, CancellationToken>((_, content, attachments, _) =>
            {
                capturedContent = content;
                capturedAttachments = attachments;
            })
            .ReturnsAsync(expectedId);

        var result = await fixture.Service.CreatePostAsync(9, request);

        Assert.AreEqual(expectedId, result);
        Assert.AreEqual("hello", capturedContent);
        Assert.IsNotNull(capturedAttachments);
        Assert.AreEqual(1, capturedAttachments.Count);
        Assert.AreEqual("https://example.com/img.png", capturedAttachments[0].Url);
        Assert.AreEqual("caption", capturedAttachments[0].Caption);
        Assert.AreEqual(eAttachmentType.Image, capturedAttachments[0].AttachmentType);
    }

    [TestMethod]
    public async Task CreatePostAsync_WhitespaceContentAndValidAttachment_PassesNullContent()
    {
        var fixture = CreateFixture();
        string? capturedContent = "sentinel";
        var request = new CreateSocialPostRequestDto
        {
            Content = "   ",
            Attachments = [CreateImageAttachment("https://example.com/x.png")]
        };
        fixture.SocialRepositoryMock
            .Setup(x => x.CreatePostAsync(1, It.IsAny<string?>(), It.IsAny<IReadOnlyList<CreateSocialPostAttachmentDto>>(), It.IsAny<CancellationToken>()))
            .Callback<int, string?, IReadOnlyList<CreateSocialPostAttachmentDto>, CancellationToken>((_, content, _, _) => capturedContent = content)
            .ReturnsAsync(Guid.NewGuid());

        await fixture.Service.CreatePostAsync(1, request);

        Assert.IsNull(capturedContent);
    }

    [TestMethod]
    public async Task UploadImageAsync_IdentityIncomplete_ThrowsSocialIdentityRequiredException()
    {
        var fixture = CreateFixture(hasIdentity: false);

        await Assert.ThrowsExceptionAsync<SocialIdentityRequiredException>(
            () => fixture.Service.UploadImageAsync(1, new UploadSocialImageRequestDto { File = CreateFormFile(CreateValidPngBytes()) }));
    }

    [TestMethod]
    public async Task UploadImageAsync_FileLengthZero_ThrowsArgumentException()
    {
        var fixture = CreateFixture();
        var file = new FormFile(Stream.Null, 0, 0, "file", "empty.png");

        await Assert.ThrowsExceptionAsync<ArgumentException>(
            () => fixture.Service.UploadImageAsync(1, new UploadSocialImageRequestDto { File = file }));
    }

    [TestMethod]
    public async Task UploadImageAsync_FileTooLarge_ThrowsArgumentException()
    {
        var fixture = CreateFixture();
        var file = CreateFormFile(new byte[MaxImageBytes + 1]);

        await Assert.ThrowsExceptionAsync<ArgumentException>(
            () => fixture.Service.UploadImageAsync(1, new UploadSocialImageRequestDto { File = file }));
    }

    [TestMethod]
    public async Task UploadImageAsync_InvalidImageContent_ThrowsArgumentException()
    {
        var fixture = CreateFixture();
        var file = CreateFormFile([0x01, 0x02, 0x03, 0x04]);

        await Assert.ThrowsExceptionAsync<ArgumentException>(
            () => fixture.Service.UploadImageAsync(1, new UploadSocialImageRequestDto { File = file }));
    }

    [TestMethod]
    public async Task UploadImageAsync_UnsupportedMimeType_ThrowsArgumentException()
    {
        var fixture = CreateFixture();
        var file = CreateFormFile(CreateValidPngBytes());
        fixture.SocialOptions.Upload.AllowedImageMimeTypes = ["image/jpeg"];
        fixture.RecreateService();

        await Assert.ThrowsExceptionAsync<ArgumentException>(
            () => fixture.Service.UploadImageAsync(1, new UploadSocialImageRequestDto { File = file }));
    }

    [TestMethod]
    public async Task UploadImageAsync_ValidImage_UploadsAndReturnsUrl()
    {
        var fixture = CreateFixture();
        var file = CreateFormFile(CreateValidPngBytes());
        const string expectedUrl = "https://storage/social.png";
        fixture.AttachmentStorageMock
            .Setup(x => x.UploadImageAsync(It.IsAny<Stream>(), "image/png", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedUrl);

        var result = await fixture.Service.UploadImageAsync(11, new UploadSocialImageRequestDto { File = file });

        Assert.AreEqual(expectedUrl, result.Url);
    }

    [TestMethod]
    public async Task CreateCommentAsync_IdentityIncomplete_ThrowsSocialIdentityRequiredException()
    {
        var fixture = CreateFixture(hasIdentity: false);
        var request = new CreateSocialCommentRequestDto { Body = "hello" };

        await Assert.ThrowsExceptionAsync<SocialIdentityRequiredException>(
            () => fixture.Service.CreateCommentAsync(1, Guid.NewGuid(), request));
    }

    [TestMethod]
    public async Task CreateCommentAsync_CommentBodyMissing_ThrowsArgumentException()
    {
        var fixture = CreateFixture();
        var request = new CreateSocialCommentRequestDto { Body = "  " };

        await Assert.ThrowsExceptionAsync<ArgumentException>(
            () => fixture.Service.CreateCommentAsync(1, Guid.NewGuid(), request));
    }

    [TestMethod]
    public async Task CreateCommentAsync_CommentBodyTooLong_ThrowsArgumentException()
    {
        var fixture = CreateFixture();
        var request = new CreateSocialCommentRequestDto { Body = new string('a', MaxContentLength + 1) };

        await Assert.ThrowsExceptionAsync<ArgumentException>(
            () => fixture.Service.CreateCommentAsync(1, Guid.NewGuid(), request));
    }

    [TestMethod]
    public async Task CreateCommentAsync_PostNotFound_ThrowsKeyNotFoundException()
    {
        var fixture = CreateFixture();
        fixture.SocialRepositoryMock
            .Setup(x => x.CreateCommentAsync(5, It.IsAny<Guid>(), "hello", null, It.IsAny<CancellationToken>()))
            .ReturnsAsync((SocialCommentDto?)null);
        var request = new CreateSocialCommentRequestDto { Body = "  hello  " };

        await Assert.ThrowsExceptionAsync<KeyNotFoundException>(
            () => fixture.Service.CreateCommentAsync(5, Guid.NewGuid(), request));
    }

    [TestMethod]
    public async Task CreateCommentAsync_ValidRequest_TrimsBodyAndReturnsComment()
    {
        var fixture = CreateFixture();
        var expected = new SocialCommentDto { Body = "hello" };
        Guid postId = Guid.NewGuid();
        Guid parentId = Guid.NewGuid();
        fixture.SocialRepositoryMock
            .Setup(x => x.CreateCommentAsync(2, postId, "hello", parentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);
        var request = new CreateSocialCommentRequestDto { Body = "  hello ", ParentCommentPublicId = parentId };

        var result = await fixture.Service.CreateCommentAsync(2, postId, request);

        Assert.AreSame(expected, result);
    }

    [TestMethod]
    public async Task SetReactionAsync_ReactionTypeNotDefined_ThrowsArgumentException()
    {
        var fixture = CreateFixture();

        await Assert.ThrowsExceptionAsync<ArgumentException>(
            () => fixture.Service.SetReactionAsync(1, Guid.NewGuid(), new SetReactionRequestDto { ReactionType = (eReactionType)999 }));
    }

    [TestMethod]
    public async Task SetReactionAsync_ValidReaction_ReturnsRepositoryValue()
    {
        var fixture = CreateFixture();
        Guid postId = Guid.NewGuid();
        fixture.SocialRepositoryMock
            .Setup(x => x.SetReactionAsync(3, postId, eReactionType.Like, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        bool? result = await fixture.Service.SetReactionAsync(3, postId, new SetReactionRequestDto { ReactionType = eReactionType.Like });

        Assert.AreEqual(true, result);
    }

    [TestMethod]
    public async Task GetReactionsAsync_Always_DelegatesToRepository()
    {
        var fixture = CreateFixture();
        Guid postId = Guid.NewGuid();
        List<SocialReactionDto> expected = [new SocialReactionDto { AuthorDisplayName = "d" }];
        fixture.SocialRepositoryMock
            .Setup(x => x.GetReactionsByPostPublicIdAsync(postId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        List<SocialReactionDto>? result = await fixture.Service.GetReactionsAsync(postId);

        Assert.AreSame(expected, result);
    }

    [TestMethod]
    public async Task GetCommentsAsync_PageSizeLessThanOrEqualToZero_UsesDefaultCommentsPageSize()
    {
        var fixture = CreateFixture();
        Guid postId = Guid.NewGuid();
        var expected = new SocialCommentPageDto { HasMore = false };
        fixture.SocialRepositoryMock
            .Setup(x => x.GetCommentsByPostPublicIdAsync(postId, DefaultCommentsPageSize, "t", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var result = await fixture.Service.GetCommentsAsync(postId, 0, "t");

        Assert.AreSame(expected, result);
    }

    [TestMethod]
    public async Task GetCommentsAsync_PageSizeGreaterThanMax_UsesMaxCommentsPageSize()
    {
        var fixture = CreateFixture();
        Guid postId = Guid.NewGuid();
        var expected = new SocialCommentPageDto { HasMore = true };
        fixture.SocialRepositoryMock
            .Setup(x => x.GetCommentsByPostPublicIdAsync(postId, MaxCommentsPageSize, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var result = await fixture.Service.GetCommentsAsync(postId, MaxCommentsPageSize + 1, null);

        Assert.AreSame(expected, result);
    }

    [TestMethod]
    public async Task GetCommentsAsync_PageSizeWithinRange_UsesProvidedCommentsPageSize()
    {
        var fixture = CreateFixture();
        Guid postId = Guid.NewGuid();
        var expected = new SocialCommentPageDto { NextPageToken = "n" };
        const int pageSize = 8;
        fixture.SocialRepositoryMock
            .Setup(x => x.GetCommentsByPostPublicIdAsync(postId, pageSize, "next", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var result = await fixture.Service.GetCommentsAsync(postId, pageSize, "next");

        Assert.AreSame(expected, result);
    }

    private static CreateSocialPostAttachmentDto CreateImageAttachment(string url)
    {
        return new CreateSocialPostAttachmentDto
        {
            AttachmentType = eAttachmentType.Image,
            Url = url
        };
    }

    private static FormFile CreateFormFile(byte[] bytes)
    {
        MemoryStream stream = new(bytes);
        return new FormFile(stream, 0, bytes.Length, "file", "upload.bin");
    }

    private static byte[] CreateValidPngBytes()
    {
        return
        [
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52
        ];
    }

    private static SocialServiceTestFixture CreateFixture(bool hasIdentity = true)
    {
        var socialRepositoryMock = new Mock<ISocialRepository>();
        var attachmentStorageMock = new Mock<ISocialAttachmentStorageService>();
        var appUserRepositoryMock = new Mock<IAppUserRepository>();
        appUserRepositoryMock
            .Setup(x => x.HasCompleteSocialIdentityAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(hasIdentity);

        var socialOptions = new SocialOptions
        {
            DefaultFeedPageSize = DefaultFeedPageSize,
            MaxFeedPageSize = MaxFeedPageSize,
            DefaultCommentsPageSize = DefaultCommentsPageSize,
            MaxCommentsPageSize = MaxCommentsPageSize,
            MaxRefreshIntervalSeconds = MaxRefreshIntervalSeconds,
            MaxAttachmentCount = MaxAttachmentCount,
            MaxContentLength = MaxContentLength,
            MaxAttachmentUrlLength = MaxAttachmentUrlLength,
            Upload = new SocialUploadOptions
            {
                MaxImageBytes = MaxImageBytes,
                AllowedImageMimeTypes = ["image/png", "image/jpeg"]
            }
        };

        return new SocialServiceTestFixture(socialRepositoryMock, attachmentStorageMock, appUserRepositoryMock, socialOptions);
    }
}
