using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.DTOs.Social;
using AchievementTracker.Data.Data;
using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace AchievementTracker.Api.DataAccess.Repositories;

public sealed class SocialRepository(AppDbContext db) : ISocialRepository
{
     private readonly AppDbContext _db = db;

     public async Task<SocialFeedPageDto> GetFeedAsync(
          int? currentAppUserId,
          int pageSize,
          string? pageToken,
          CancellationToken ct = default)
     {
          IQueryable<SocialPost> query = _db.SocialPosts.AsNoTracking();
          return await BuildFeedPageAsync(query, currentAppUserId, pageSize, pageToken, ct);
     }

     public async Task<SocialFeedPageDto> GetFeedByAuthorPublicIdAsync(
          int? currentAppUserId,
          Guid authorPublicId,
          int pageSize,
          string? pageToken,
          CancellationToken ct = default)
     {
          int? authorAppUserId = await _db.AppUsers
               .AsNoTracking()
               .Where(x => x.PublicId == authorPublicId)
               .Select(x => (int?)x.AppUserId)
               .SingleOrDefaultAsync(ct);

          if (!authorAppUserId.HasValue)
               return new SocialFeedPageDto();

          IQueryable<SocialPost> query = _db.SocialPosts
               .AsNoTracking()
               .Where(x => x.AuthorAppUserId == authorAppUserId.Value);

          return await BuildFeedPageAsync(query, currentAppUserId, pageSize, pageToken, ct);
     }

     public async Task<SocialFeedPageDto> GetFeedSinceAsync(int? currentAppUserId, DateTime sinceUtc, int pageSize, CancellationToken ct = default)
     {
          List<int> postIds = await _db.SocialPosts
               .AsNoTracking()
               .Where(x => x.CreateDate >= sinceUtc)
               .OrderByDescending(x => x.CreateDate)
               .ThenByDescending(x => x.SocialPostId)
               .Select(x => x.SocialPostId)
               .Take(pageSize)
               .ToListAsync(ct);

          return await BuildFeedPageFromIdsAsync(postIds, currentAppUserId, pageSize, ct);
     }

     public async Task<Guid> CreatePostAsync(int authorAppUserId, string? content, IReadOnlyList<CreateSocialPostAttachmentDto> attachments, CancellationToken ct = default)
     {
          SocialPost post = new SocialPost
          {
               AuthorAppUserId = authorAppUserId,
               Content = content
          };

          const short displayOrderStep = 100;
          for (int i = 0; i < attachments.Count; i++)
          {
               CreateSocialPostAttachmentDto attachment = attachments[i];
               post.Attachments.Add(new SocialPostAttachment
               {
                    AttachmentType = attachment.AttachmentType,
                    Url = attachment.Url,
                    Caption = attachment.Caption,
                    DisplayOrder = (short)((i + 1) * displayOrderStep)
               });
          }

          _db.SocialPosts.Add(post);
          await _db.SaveChangesAsync(ct);
          return post.PublicId;
     }

     public async Task<SocialCommentDto?> CreateCommentAsync(int authorAppUserId, Guid postPublicId, string body, Guid? parentCommentPublicId, CancellationToken ct = default)
     {
          int? postId = await _db.SocialPosts
               .AsNoTracking()
               .Where(x => x.PublicId == postPublicId)
               .Select(x => (int?)x.SocialPostId)
               .SingleOrDefaultAsync(ct);
          if (!postId.HasValue)
               return null;

          int? parentCommentId = null;
          if (parentCommentPublicId.HasValue)
          {
               parentCommentId = await _db.SocialPostComments
                    .AsNoTracking()
                    .Where(x => x.SocialPostId == postId.Value && x.PublicId == parentCommentPublicId.Value)
                    .Select(x => (int?)x.SocialPostCommentId)
                    .SingleOrDefaultAsync(ct);
               if (!parentCommentId.HasValue)
                    return null;
          }

          SocialPostComment comment = new SocialPostComment
          {
               SocialPostId = postId.Value,
               AuthorAppUserId = authorAppUserId,
               Body = body,
               ParentCommentId = parentCommentId
          };

          _db.SocialPostComments.Add(comment);
          await _db.SaveChangesAsync(ct);

          SocialCommentDto created = await _db.SocialPostComments
               .AsNoTracking()
               .Where(x => x.SocialPostCommentId == comment.SocialPostCommentId)
               .Select(x => new SocialCommentDto
               {
                    SocialPostCommentId = x.SocialPostCommentId,
                    CommentPublicId = x.PublicId,
                    AuthorPublicId = x.AppUser.PublicId,
                    AuthorHandle = x.AppUser.Handle,
                    AuthorDisplayName = x.AppUser.DisplayName,
                    Body = x.Body,
                    CreateDate = x.CreateDate,
                    ParentCommentId = x.ParentCommentId
               })
               .SingleAsync(ct);

          return created;
     }

     public async Task<bool?> SetReactionAsync(int authorAppUserId, Guid postPublicId, AchievementTracker.Data.Enums.eReactionType reactionType, CancellationToken ct = default)
     {
          int? postId = await _db.SocialPosts
               .AsNoTracking()
               .Where(x => x.PublicId == postPublicId)
               .Select(x => (int?)x.SocialPostId)
               .SingleOrDefaultAsync(ct);
          if (!postId.HasValue)
               return null;

          SocialPostReaction? existing = await _db.SocialPostReactions
               .SingleOrDefaultAsync(x => x.SocialPostId == postId.Value && x.AppUserId == authorAppUserId, ct);

          if (existing == null)
          {
               _db.SocialPostReactions.Add(new SocialPostReaction
               {
                    SocialPostId = postId.Value,
                    AppUserId = authorAppUserId,
                    ReactionType = reactionType
               });
          }
          else
          {
               existing.ReactionType = reactionType;
          }

          await _db.SaveChangesAsync(ct);
          return true;
     }

     public async Task<List<SocialReactionDto>?> GetReactionsByPostPublicIdAsync(Guid postPublicId, CancellationToken ct = default)
     {
          int? postId = await _db.SocialPosts.AsNoTracking()
               .Where(x => x.PublicId == postPublicId)
               .Select(x => (int?)x.SocialPostId)
               .SingleOrDefaultAsync(ct);

          if (!postId.HasValue)
               return null;

          return await _db.SocialPostReactions
               .AsNoTracking()
               .Where(x => x.SocialPostId == postId.Value)
               .OrderBy(x => x.AppUser.Handle)
               .ThenBy(x => x.AppUser.DisplayName)
               .Select(x => new SocialReactionDto
               {
                    AuthorPublicId = x.AppUser.PublicId,
                    AuthorHandle = x.AppUser.Handle,
                    AuthorDisplayName = x.AppUser.DisplayName,
                    ReactionType = x.ReactionType
               })
               .ToListAsync(ct);
     }

     public async Task<SocialCommentPageDto?> GetCommentsByPostPublicIdAsync(Guid postPublicId, CancellationToken ct = default)
     {
          int? postId = await _db.SocialPosts.AsNoTracking()
               .Where(x => x.PublicId == postPublicId)
               .Select(x => (int?)x.SocialPostId)
               .SingleOrDefaultAsync(ct);

          if (!postId.HasValue)
               return null;

          List<SocialCommentDto> flat = await _db.SocialPostComments
               .AsNoTracking()
               .Where(x => x.SocialPostId == postId.Value)
               .OrderBy(x => x.CreateDate)
               .ThenBy(x => x.SocialPostCommentId)
               .Select(x => new SocialCommentDto
               {
                    SocialPostCommentId = x.SocialPostCommentId,
                    CommentPublicId = x.PublicId,
                    AuthorPublicId = x.AppUser.PublicId,
                    AuthorHandle = x.AppUser.Handle,
                    AuthorDisplayName = x.AppUser.DisplayName,
                    Body = x.Body,
                    CreateDate = x.CreateDate,
                    ParentCommentId = x.ParentCommentId
               })
               .ToListAsync(ct);

          Dictionary<int, SocialCommentDto> byId = flat.ToDictionary(x => x.SocialPostCommentId);
          List<SocialCommentDto> roots = [];

          foreach (SocialCommentDto comment in flat)
          {
               if (!comment.ParentCommentId.HasValue)
               {
                    roots.Add(comment);
                    continue;
               }

               if (byId.TryGetValue(comment.ParentCommentId.Value, out SocialCommentDto? parent))
               {
                    parent.Replies.Add(comment);
               }
               else
               {
                    roots.Add(comment);
               }
          }

          return new SocialCommentPageDto
          {
               Items = roots,
               HasMore = false,
               NextPageToken = null
          };
     }

     private async Task<SocialFeedPageDto> BuildFeedPageAsync(
          IQueryable<SocialPost> query,
          int? currentAppUserId,
          int pageSize,
          string? pageToken,
          CancellationToken ct)
     {
          if (TryParsePageToken(pageToken, out DateTime anchorCreateDate, out int anchorPostId))
          {
               query = query.Where(x =>
                    x.CreateDate < anchorCreateDate
                    || (x.CreateDate == anchorCreateDate && x.SocialPostId < anchorPostId));
          }

          List<int> postIds = await query
               .OrderByDescending(x => x.CreateDate)
               .ThenByDescending(x => x.SocialPostId)
               .Select(x => x.SocialPostId)
               .Take(pageSize + 1)
               .ToListAsync(ct);

          return await BuildFeedPageFromIdsAsync(postIds, currentAppUserId, pageSize, ct);
     }

     private async Task<SocialFeedPageDto> BuildFeedPageFromIdsAsync(List<int> idsWithOverflow, int? currentAppUserId, int pageSize, CancellationToken ct)
     {
          bool hasMore = idsWithOverflow.Count > pageSize;
          List<int> postIds = idsWithOverflow.Take(pageSize).ToList();

          if (postIds.Count == 0)
               return new SocialFeedPageDto { HasMore = false, NextPageToken = null };

          List<SocialPost> posts = await _db.SocialPosts
               .AsNoTracking()
               .Where(x => postIds.Contains(x.SocialPostId))
               .OrderByDescending(x => x.CreateDate)
               .ThenByDescending(x => x.SocialPostId)
               .ToListAsync(ct);

          List<AttachmentProjection> attachmentRows = await _db.SocialPostAttachments
               .AsNoTracking()
               .Where(x => postIds.Contains(x.SocialPostId))
               .OrderBy(x => x.DisplayOrder)
               .Select(x => new AttachmentProjection
               {
                    SocialPostId = x.SocialPostId,
                    AttachmentType = x.AttachmentType,
                    Url = x.Url,
                    Caption = x.Caption,
                    DisplayOrder = x.DisplayOrder
               })
               .ToListAsync(ct);

          List<CommentProjection> commentRows = await _db.SocialPostComments
               .AsNoTracking()
               .Where(x => postIds.Contains(x.SocialPostId))
               .Select(x => new CommentProjection
               {
                    SocialPostId = x.SocialPostId,
                    SocialPostCommentId = x.SocialPostCommentId,
                    CommentPublicId = x.PublicId,
                    AuthorPublicId = x.AppUser.PublicId,
                    AuthorHandle = x.AppUser.Handle,
                    AuthorDisplayName = x.AppUser.DisplayName,
                    Body = x.Body,
                    CreateDate = x.CreateDate,
                    ParentCommentId = x.ParentCommentId
               })
               .ToListAsync(ct);

          List<ReactionProjection> reactionRows = await _db.SocialPostReactions
               .AsNoTracking()
               .Where(x => postIds.Contains(x.SocialPostId))
               .Select(x => new ReactionProjection
               {
                    SocialPostId = x.SocialPostId,
                    AppUserId = x.AppUserId,
                    ReactionType = x.ReactionType
               })
               .ToListAsync(ct);

          Dictionary<int, AppUserProjection> authors = await _db.AppUsers
               .AsNoTracking()
               .Where(x => posts.Select(p => p.AuthorAppUserId).Contains(x.AppUserId))
               .Select(x => new AppUserProjection
               {
                    AppUserId = x.AppUserId,
                    PublicId = x.PublicId,
                    Handle = x.Handle,
                    DisplayName = x.DisplayName
               })
               .ToDictionaryAsync(x => x.AppUserId, ct);

          Dictionary<int, List<SocialPostAttachmentDto>> attachmentsByPost = attachmentRows
               .GroupBy(x => x.SocialPostId)
               .ToDictionary(
                    x => x.Key,
                    x => x.Select(y => new SocialPostAttachmentDto
                    {
                         AttachmentType = y.AttachmentType,
                         Url = y.Url,
                         Caption = y.Caption,
                         DisplayOrder = y.DisplayOrder
                    }).ToList());

          Dictionary<int, int> commentCountByPost = commentRows
               .GroupBy(x => x.SocialPostId)
               .ToDictionary(x => x.Key, x => x.Count());

          Dictionary<int, int> reactionCountByPost = reactionRows
               .GroupBy(x => x.SocialPostId)
               .ToDictionary(x => x.Key, x => x.Count());

          Dictionary<int, ReactionProjection> currentUserReactionByPost = currentAppUserId.HasValue
               ? reactionRows
                    .Where(x => x.AppUserId == currentAppUserId.Value)
                    .ToDictionary(x => x.SocialPostId, x => x)
               : [];

          Dictionary<int, CommentProjection> topCommentByPost = commentRows
               .GroupBy(x => x.SocialPostId)
               .ToDictionary(
                    x => x.Key,
                    x => x.OrderByDescending(y => y.CreateDate)
                          .ThenByDescending(y => y.SocialPostCommentId)
                          .First()
               );

          List<SocialFeedItemDto> items = posts.Select(post =>
          {
               AppUserProjection author = authors[post.AuthorAppUserId];

               topCommentByPost.TryGetValue(post.SocialPostId, out CommentProjection? topComment);
               currentUserReactionByPost.TryGetValue(post.SocialPostId, out ReactionProjection? currentReaction);

               return new SocialFeedItemDto
               {
                    PostPublicId = post.PublicId,
                    AuthorPublicId = author.PublicId,
                    AuthorHandle = author.Handle,
                    AuthorDisplayName = author.DisplayName,
                    CreateDate = post.CreateDate,
                    Content = post.Content,
                    Attachments = attachmentsByPost.TryGetValue(
                              post.SocialPostId,
                              out List<SocialPostAttachmentDto>? attachments)
                         ? attachments
                         : [],
                    CommentCount = commentCountByPost.GetValueOrDefault(post.SocialPostId),
                    ReactionCount = reactionCountByPost.GetValueOrDefault(post.SocialPostId),
                    CurrentUserReaction = currentReaction?.ReactionType,
                    TopComment = topComment == null
                         ? null
                         : new SocialCommentDto
                         {
                              SocialPostCommentId = topComment.SocialPostCommentId,
                              CommentPublicId = topComment.CommentPublicId,
                              AuthorPublicId = topComment.AuthorPublicId,
                              AuthorHandle = topComment.AuthorHandle,
                              AuthorDisplayName = topComment.AuthorDisplayName,
                              Body = topComment.Body,
                              CreateDate = topComment.CreateDate,
                              ParentCommentId = topComment.ParentCommentId
                         },
                    TopCommentTimestamp = topComment?.CreateDate
               };
          }).ToList();

          SocialFeedItemDto last = items[^1];
          SocialPost lastPost = posts[^1];
          string nextPageToken = EncodePageToken(last.CreateDate, lastPost.SocialPostId);

          return new SocialFeedPageDto
          {
               Items = items,
               HasMore = hasMore,
               NextPageToken = hasMore ? nextPageToken : null
          };
     }

     private static string EncodePageToken(DateTime createDate, int socialPostId)
     {
          return $"{createDate.Ticks}:{socialPostId}";
     }

     private static bool TryParsePageToken(
          string? pageToken,
          out DateTime createDate,
          out int socialPostId)
     {
          createDate = default;
          socialPostId = default;
          if (string.IsNullOrWhiteSpace(pageToken))
               return false;

          string[] parts = pageToken.Split(':', StringSplitOptions.RemoveEmptyEntries);
          if (parts.Length != 2)
               return false;

          if (!long.TryParse(parts[0], out long ticks) || !int.TryParse(parts[1], out socialPostId))
               return false;

          createDate = new DateTime(ticks, DateTimeKind.Utc);
          return true;
     }

     private sealed record CommentProjection
     {
          public int SocialPostId { get; init; }
          public int SocialPostCommentId { get; init; }
          public Guid CommentPublicId { get; init; }
          public Guid AuthorPublicId { get; init; }
          public string? AuthorHandle { get; init; }
          public string? AuthorDisplayName { get; init; }
          public required string Body { get; init; }
          public DateTime CreateDate { get; init; }
          public int? ParentCommentId { get; init; }
     }

     private sealed record AttachmentProjection
     {
          public int SocialPostId { get; init; }
          public AchievementTracker.Data.Enums.eAttachmentType AttachmentType { get; init; }
          public required string Url { get; init; }
          public string? Caption { get; init; }
          public short DisplayOrder { get; init; }
     }

     private sealed record ReactionProjection
     {
          public int SocialPostId { get; init; }
          public int AppUserId { get; init; }
          public AchievementTracker.Data.Enums.eReactionType ReactionType { get; init; }
     }

     private sealed record AppUserProjection
     {
          public int AppUserId { get; init; }
          public Guid PublicId { get; init; }
          public string? Handle { get; init; }
          public string? DisplayName { get; init; }
     }
}
