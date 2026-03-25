using AchievementTracker.Api.Models.DTOs.Social;
using AchievementTracker.Data.Enums;

namespace AchievementTracker.Api.DataAccess.Interfaces;

public interface ISocialRepository
{
     Task<SocialFeedPageDto> GetFeedAsync(
          int? currentAppUserId,
          int pageSize,
          string? pageToken,
          CancellationToken ct = default);

     Task<SocialFeedPageDto> GetFeedByAuthorPublicIdAsync(
          int? currentAppUserId,
          Guid authorPublicId,
          int pageSize,
          string? pageToken,
          CancellationToken ct = default);
     Task<SocialFeedPageDto> GetFeedSinceAsync(int? currentAppUserId, DateTime sinceUtc, int pageSize, CancellationToken ct = default);
     Task<Guid> CreatePostAsync(int authorAppUserId, string? content, IReadOnlyList<CreateSocialPostAttachmentDto> attachments, CancellationToken ct = default);
     Task<SocialCommentDto?> CreateCommentAsync(int authorAppUserId, Guid postPublicId, string body, Guid? parentCommentPublicId, CancellationToken ct = default);
     Task<bool?> SetReactionAsync(int authorAppUserId, Guid postPublicId, eReactionType reactionType, CancellationToken ct = default);
     Task<List<SocialReactionDto>?> GetReactionsByPostPublicIdAsync(Guid postPublicId, CancellationToken ct = default);
     Task<SocialCommentPageDto?> GetCommentsByPostPublicIdAsync(Guid postPublicId, CancellationToken ct = default);
}
