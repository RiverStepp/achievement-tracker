using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.DTOs.Social;
using AchievementTracker.Api.Models.Options;
using AchievementTracker.Api.Services.Interfaces;
using AchievementTracker.Data.Enums;
using Microsoft.Extensions.Options;

namespace AchievementTracker.Api.Services.BusinessLogic;

public sealed class SocialService(
     ISocialRepository socialRepository,
     ISocialAttachmentStorageService socialAttachmentStorageService,
     IAppUserRepository appUserRepository,
     IOptions<SocialOptions> socialOptions) : ISocialService
{
     private const string ErrIntervalOutOfRangeFormat =
          "Interval seconds must be between 1 and {0}.";
     private const string ErrContentTooLongFormat = "Content must be {0} characters or fewer.";
     private const string ErrAttachmentCountExceededFormat =
          "Attachment count cannot exceed {0}.";
     private const string ErrPostRequiresContentOrAttachment =
          "Post must include content, at least one attachment, or both.";
     private const string ErrInvalidAttachmentType = "Invalid attachment type.";
     private const string ErrAttachmentTypeNotSupported = "Attachment type is not supported.";
     private const string ErrAttachmentUrlEmpty = "Attachment URL cannot be empty.";
     private const string ErrAttachmentUrlTooLongFormat =
          "Attachment URL must be {0} characters or fewer.";
     private const string ErrAttachmentCaptionTooLongFormat =
          "Attachment caption must be {0} characters or fewer.";
     private const string ErrAttachmentDataUrlNotAllowed =
          "Attachment URL cannot be a data URL.";
     private const string ErrAttachmentUrlMustBeHttp =
          "Attachment URL must be a valid HTTP or HTTPS URL.";
     private const string ErrFileRequired = "File is required.";
     private const string ErrFileTooLargeFormat = "File exceeds max size of {0} bytes.";
     private const string ErrUnsupportedImageMimeType = "Unsupported image MIME type.";
     private const string ErrCommentBodyRequired = "Comment body is required.";
     private const string ErrCommentBodyTooLongFormat =
          "Comment body must be {0} characters or fewer.";
     private const string ErrPostOrParentNotFound = "Post or parent comment was not found.";
     private const string ErrInvalidReactionType = "Invalid reaction type.";
     private const string ErrSocialIdentityRequired =
          "Set your handle and display name before posting, commenting, or uploading images.";

     private readonly ISocialRepository _socialRepository = socialRepository;
     private readonly ISocialAttachmentStorageService _socialAttachmentStorageService =
          socialAttachmentStorageService;

     private readonly IAppUserRepository _appUserRepository = appUserRepository;
     private readonly SocialOptions _social = socialOptions.Value;

     public Task<SocialFeedPageDto> GetFeedAsync(
          int? currentAppUserId,
          int pageSize,
          string? pageToken,
          CancellationToken ct = default)
     {
          int size = NormalizePageSize(pageSize);
          return _socialRepository.GetFeedAsync(currentAppUserId, size, pageToken, ct);
     }

     public Task<SocialFeedPageDto> GetFeedByUserAsync(
          int? currentAppUserId,
          Guid authorPublicId,
          int pageSize,
          string? pageToken,
          CancellationToken ct = default)
     {
          int size = NormalizePageSize(pageSize);
          return _socialRepository.GetFeedByAuthorPublicIdAsync(
               currentAppUserId,
               authorPublicId,
               size,
               pageToken,
               ct);
     }

     public Task<SocialFeedPageDto> GetFeedRefreshAsync(
          int? currentAppUserId,
          int intervalSeconds,
          int pageSize,
          CancellationToken ct = default)
     {
          int size = NormalizePageSize(pageSize);
          if (intervalSeconds <= 0 || intervalSeconds > _social.MaxRefreshIntervalSeconds)
          {
               throw new ArgumentOutOfRangeException(
                    nameof(intervalSeconds),
                    string.Format(ErrIntervalOutOfRangeFormat, _social.MaxRefreshIntervalSeconds));
          }

          DateTime sinceUtc = DateTime.UtcNow.AddSeconds(-intervalSeconds);
          return _socialRepository.GetFeedSinceAsync(currentAppUserId, sinceUtc, size, ct);
     }

     public async Task<Guid> CreatePostAsync(
          int currentAppUserId,
          CreateSocialPostRequestDto request,
          CancellationToken ct = default)
     {
          await RequireCompleteSocialIdentityAsync(currentAppUserId, ct);

          string? trimmedContent = request.Content?.Trim();
          if (!string.IsNullOrEmpty(trimmedContent) && trimmedContent.Length > _social.MaxContentLength)
          {
               throw new ArgumentException(
                    string.Format(ErrContentTooLongFormat, _social.MaxContentLength),
                    nameof(request));
          }

          if (request.Attachments.Count > _social.MaxAttachmentCount)
          {
               throw new ArgumentException(
                    string.Format(ErrAttachmentCountExceededFormat, _social.MaxAttachmentCount),
                    nameof(request));
          }

          if (string.IsNullOrWhiteSpace(trimmedContent) && request.Attachments.Count == 0)
          {
               throw new ArgumentException(ErrPostRequiresContentOrAttachment, nameof(request));
          }

          List<CreateSocialPostAttachmentDto> normalizedAttachments = [];
          foreach (CreateSocialPostAttachmentDto attachment in request.Attachments)
          {
               if (!Enum.IsDefined(attachment.AttachmentType))
                    throw new ArgumentException(ErrInvalidAttachmentType, nameof(request));

               string url = attachment.Url.Trim();
               if (string.IsNullOrWhiteSpace(url))
                    throw new ArgumentException(ErrAttachmentUrlEmpty, nameof(request));

               if (url.Length > _social.MaxAttachmentUrlLength)
               {
                    throw new ArgumentException(
                         string.Format(ErrAttachmentUrlTooLongFormat, _social.MaxAttachmentUrlLength),
                         nameof(request));
               }

               string? caption = attachment.Caption?.Trim();
               if (!string.IsNullOrEmpty(caption) && caption.Length > _social.MaxContentLength)
               {
                    throw new ArgumentException(
                         string.Format(ErrAttachmentCaptionTooLongFormat, _social.MaxContentLength),
                         nameof(request));
               }

               if (url.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
                    throw new ArgumentException(ErrAttachmentDataUrlNotAllowed, nameof(request));

               if (!IsHttpOrHttpsUrl(url))
                    throw new ArgumentException(ErrAttachmentUrlMustBeHttp, nameof(request));

               if (attachment.AttachmentType != eAttachmentType.Image
                   && attachment.AttachmentType != eAttachmentType.Embed)
               {
                    throw new ArgumentException(ErrAttachmentTypeNotSupported, nameof(request));
               }

               normalizedAttachments.Add(new CreateSocialPostAttachmentDto
               {
                    AttachmentType = attachment.AttachmentType,
                    Url = url,
                    Caption = caption
               });
          }

          return await _socialRepository.CreatePostAsync(
               currentAppUserId,
               string.IsNullOrWhiteSpace(trimmedContent) ? null : trimmedContent,
               normalizedAttachments,
               ct);
     }

     public async Task<UploadSocialImageResponseDto> UploadImageAsync(
          int currentAppUserId,
          UploadSocialImageRequestDto request,
          CancellationToken ct = default)
     {
          await RequireCompleteSocialIdentityAsync(currentAppUserId, ct);

          if (request.File.Length <= 0)
               throw new ArgumentException(ErrFileRequired, nameof(request));

          if (request.File.Length > _social.Upload.MaxImageBytes)
          {
               throw new ArgumentException(
                    string.Format(ErrFileTooLargeFormat, _social.Upload.MaxImageBytes),
                    nameof(request));
          }

          bool allowedMime = _social.Upload.AllowedImageMimeTypes
               .Any(x => x.Equals(request.File.ContentType, StringComparison.OrdinalIgnoreCase));
          if (!allowedMime)
               throw new ArgumentException(ErrUnsupportedImageMimeType, nameof(request));

          await using Stream stream = request.File.OpenReadStream();
          string url = await _socialAttachmentStorageService.UploadImageAsync(
               stream,
               request.File.ContentType,
               ct);

          return new UploadSocialImageResponseDto { Url = url };
     }

     public async Task<SocialCommentDto> CreateCommentAsync(
          int currentAppUserId,
          Guid postPublicId,
          CreateSocialCommentRequestDto request,
          CancellationToken ct = default)
     {
          await RequireCompleteSocialIdentityAsync(currentAppUserId, ct);

          string body = request.Body?.Trim() ?? string.Empty;
          if (string.IsNullOrWhiteSpace(body))
               throw new ArgumentException(ErrCommentBodyRequired, nameof(request));

          if (body.Length > _social.MaxContentLength)
          {
               throw new ArgumentException(
                    string.Format(ErrCommentBodyTooLongFormat, _social.MaxContentLength),
                    nameof(request));
          }

          SocialCommentDto? created = await _socialRepository.CreateCommentAsync(
               currentAppUserId,
               postPublicId,
               body,
               request.ParentCommentPublicId,
               ct);

          if (created == null)
               throw new KeyNotFoundException(ErrPostOrParentNotFound);

          return created;
     }

     public async Task<bool?> SetReactionAsync(
          int currentAppUserId,
          Guid postPublicId,
          SetReactionRequestDto request,
          CancellationToken ct = default)
     {
          if (!Enum.IsDefined(request.ReactionType))
               throw new ArgumentException(ErrInvalidReactionType, nameof(request));

          return await _socialRepository.SetReactionAsync(
               currentAppUserId,
               postPublicId,
               request.ReactionType,
               ct);
     }

     public Task<List<SocialReactionDto>?> GetReactionsAsync(Guid postPublicId, CancellationToken ct = default)
     {
          return _socialRepository.GetReactionsByPostPublicIdAsync(postPublicId, ct);
     }

     public Task<SocialCommentPageDto?> GetCommentsAsync(Guid postPublicId, CancellationToken ct = default)
     {
          return _socialRepository.GetCommentsByPostPublicIdAsync(postPublicId, ct);
     }

     private int NormalizePageSize(int pageSize)
     {
          if (pageSize <= 0)
               return _social.DefaultFeedPageSize;
          if (pageSize > _social.MaxFeedPageSize)
               return _social.MaxFeedPageSize;
          return pageSize;
     }

     private static bool IsHttpOrHttpsUrl(string url)
     {
          if (!Uri.TryCreate(url, UriKind.Absolute, out Uri? uri))
               return false;

          return uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps;
     }

     private async Task RequireCompleteSocialIdentityAsync(int appUserId, CancellationToken ct)
     {
          if (!await _appUserRepository.HasCompleteSocialIdentityAsync(appUserId, ct))
               throw new SocialIdentityRequiredException(ErrSocialIdentityRequired);
     }
}

public sealed class SocialIdentityRequiredException(string message) : InvalidOperationException(message);
