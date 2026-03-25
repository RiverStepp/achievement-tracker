using AchievementTracker.Api.Models.DTOs.Social;

namespace AchievementTracker.Api.Services.Interfaces;

public interface ISocialService
{
     Task<SocialFeedPageDto> GetFeedAsync(
          int? currentAppUserId,
          int pageSize,
          string? pageToken,
          CancellationToken ct = default);

     Task<SocialFeedPageDto> GetFeedByUserAsync(
          int? currentAppUserId,
          Guid authorPublicId,
          int pageSize,
          string? pageToken,
          CancellationToken ct = default);
     Task<SocialFeedPageDto> GetFeedRefreshAsync(int? currentAppUserId, int intervalSeconds, int pageSize, CancellationToken ct = default);
     Task<Guid> CreatePostAsync(int currentAppUserId, CreateSocialPostRequestDto request, CancellationToken ct = default);
     Task<UploadSocialImageResponseDto> UploadImageAsync(
          int currentAppUserId,
          UploadSocialImageRequestDto request,
          CancellationToken ct = default);
     Task<SocialCommentDto> CreateCommentAsync(int currentAppUserId, Guid postPublicId, CreateSocialCommentRequestDto request, CancellationToken ct = default);
     Task<bool?> SetReactionAsync(int currentAppUserId, Guid postPublicId, SetReactionRequestDto request, CancellationToken ct = default);
     Task<List<SocialReactionDto>?> GetReactionsAsync(Guid postPublicId, CancellationToken ct = default);
     Task<SocialCommentPageDto?> GetCommentsAsync(Guid postPublicId, CancellationToken ct = default);
}
