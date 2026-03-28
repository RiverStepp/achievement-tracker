using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Helpers;
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
          SocialPageTokenParser.RequireValidOrNull(pageToken);

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
          SocialPageTokenParser.RequireValidOrNull(pageToken);

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
               .Take(pageSize + 1)
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
                    CommentPublicId = x.PublicId,
                    AuthorPublicId = x.AppUser.PublicId,
                    AuthorHandle = x.AppUser.Handle,
                    AuthorDisplayName = x.AppUser.DisplayName,
                    Body = x.Body,
                    CreateDate = x.CreateDate,
                    ParentCommentPublicId = x.ParentComment != null ? x.ParentComment.PublicId : null
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

     public async Task<SocialCommentPageDto?> GetCommentsByPostPublicIdAsync(
          Guid postPublicId,
          int pageSize,
          string? pageToken,
          CancellationToken ct = default)
     {
          SocialPageTokenParser.RequireValidOrNull(pageToken);

          int? postId = await _db.SocialPosts.AsNoTracking()
               .Where(x => x.PublicId == postPublicId)
               .Select(x => (int?)x.SocialPostId)
               .SingleOrDefaultAsync(ct);

          if (!postId.HasValue)
               return null;

          IQueryable<SocialPostComment> rootsQuery = _db.SocialPostComments
               .AsNoTracking()
               .Where(x => x.SocialPostId == postId.Value && x.ParentCommentId == null);

          if (SocialPageTokenParser.TryParse(pageToken, out DateTime anchorCreateDate, out int anchorCommentId))
          {
               rootsQuery = rootsQuery.Where(x =>
                    x.CreateDate > anchorCreateDate
                    || (x.CreateDate == anchorCreateDate && x.SocialPostCommentId > anchorCommentId));
          }

          List<SocialCommentRootCursorRow> rootRows = (await rootsQuery
               .OrderBy(x => x.CreateDate)
               .ThenBy(x => x.SocialPostCommentId)
               .Select(x => new { x.SocialPostCommentId, x.CreateDate })
               .Take(pageSize + 1)
               .ToListAsync(ct))
               .Select(x => new SocialCommentRootCursorRow
               {
                    SocialPostCommentId = x.SocialPostCommentId,
                    CreateDate = x.CreateDate
               })
               .ToList();

          bool hasMore = rootRows.Count > pageSize;
          List<int> pageRootIds = rootRows.Take(pageSize).Select(x => x.SocialPostCommentId).ToList();

          if (pageRootIds.Count == 0)
          {
               return new SocialCommentPageDto
               {
                    Items = [],
                    HasMore = false,
                    NextPageToken = null
               };
          }

          List<SocialPostComment> rootEntities = await _db.SocialPostComments
               .AsNoTracking()
               .Where(x => pageRootIds.Contains(x.SocialPostCommentId))
               .Include(x => x.AppUser)
               .OrderBy(x => x.CreateDate)
               .ThenBy(x => x.SocialPostCommentId)
               .ToListAsync(ct);

          Dictionary<int, SocialPostComment> collectedById = rootEntities.ToDictionary(x => x.SocialPostCommentId);
          HashSet<int> frontier = pageRootIds.ToHashSet();

          while (frontier.Count > 0)
          {
               List<SocialPostComment> children = await _db.SocialPostComments
                    .AsNoTracking()
                    .Where(x =>
                         x.SocialPostId == postId.Value
                         && x.ParentCommentId != null
                         && frontier.Contains(x.ParentCommentId.Value))
                    .Include(x => x.AppUser)
                    .OrderBy(x => x.CreateDate)
                    .ThenBy(x => x.SocialPostCommentId)
                    .ToListAsync(ct);

               if (children.Count == 0)
                    break;

               frontier.Clear();
               foreach (SocialPostComment child in children)
               {
                    if (collectedById.TryAdd(child.SocialPostCommentId, child))
                         frontier.Add(child.SocialPostCommentId);
               }
          }

          Dictionary<int, Guid> publicIdByInternalId = collectedById.Values.ToDictionary(
               x => x.SocialPostCommentId,
               x => x.PublicId);

          Dictionary<int, SocialCommentDto> dtoByInternalId = [];

          foreach (SocialPostComment entity in collectedById.Values.OrderBy(x => x.CreateDate).ThenBy(x => x.SocialPostCommentId))
          {
               Guid? parentPublicId = null;
               if (entity.ParentCommentId.HasValue
                    && publicIdByInternalId.TryGetValue(entity.ParentCommentId.Value, out Guid parentPid))
               {
                    parentPublicId = parentPid;
               }

               dtoByInternalId[entity.SocialPostCommentId] = new SocialCommentDto
               {
                    CommentPublicId = entity.PublicId,
                    AuthorPublicId = entity.AppUser.PublicId,
                    AuthorHandle = entity.AppUser.Handle,
                    AuthorDisplayName = entity.AppUser.DisplayName,
                    Body = entity.Body,
                    CreateDate = entity.CreateDate,
                    ParentCommentPublicId = parentPublicId
               };
          }

          List<SocialCommentDto> roots = [];
          foreach (int rootId in pageRootIds)
          {
               if (dtoByInternalId.TryGetValue(rootId, out SocialCommentDto? rootDto))
                    roots.Add(rootDto);
          }

          foreach (SocialPostComment entity in collectedById.Values
                    .Where(x => !pageRootIds.Contains(x.SocialPostCommentId))
                    .OrderBy(x => x.CreateDate)
                    .ThenBy(x => x.SocialPostCommentId))
          {
               if (!entity.ParentCommentId.HasValue)
                    continue;

               if (dtoByInternalId.TryGetValue(entity.ParentCommentId.Value, out SocialCommentDto? parent)
                    && dtoByInternalId.TryGetValue(entity.SocialPostCommentId, out SocialCommentDto? child))
               {
                    parent.Replies.Add(child);
               }
          }

          SocialCommentRootCursorRow lastReturnedRoot = rootRows[pageRootIds.Count - 1];
          string? nextToken = hasMore
               ? SocialPageTokenParser.Encode(lastReturnedRoot.CreateDate, lastReturnedRoot.SocialPostCommentId)
               : null;

          return new SocialCommentPageDto
          {
               Items = roots,
               HasMore = hasMore,
               NextPageToken = nextToken
          };
     }

     private async Task<SocialFeedPageDto> BuildFeedPageAsync(
          IQueryable<SocialPost> query,
          int? currentAppUserId,
          int pageSize,
          string? pageToken,
          CancellationToken ct)
     {
          if (SocialPageTokenParser.TryParse(pageToken, out DateTime anchorCreateDate, out int anchorPostId))
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

          List<FeedAttachmentProjection> attachmentRows = await _db.SocialPostAttachments
               .AsNoTracking()
               .Where(x => postIds.Contains(x.SocialPostId))
               .OrderBy(x => x.DisplayOrder)
               .Select(x => new FeedAttachmentProjection
               {
                    SocialPostId = x.SocialPostId,
                    AttachmentType = x.AttachmentType,
                    Url = x.Url,
                    Caption = x.Caption,
                    DisplayOrder = x.DisplayOrder
               })
               .ToListAsync(ct);

          List<FeedCommentProjection> commentRows = await _db.SocialPostComments
               .AsNoTracking()
               .Where(x => postIds.Contains(x.SocialPostId))
               .Select(x => new FeedCommentProjection
               {
                    SocialPostId = x.SocialPostId,
                    SocialPostCommentId = x.SocialPostCommentId,
                    CommentPublicId = x.PublicId,
                    AuthorPublicId = x.AppUser.PublicId,
                    AuthorHandle = x.AppUser.Handle,
                    AuthorDisplayName = x.AppUser.DisplayName,
                    Body = x.Body,
                    CreateDate = x.CreateDate,
                    ParentCommentPublicId = x.ParentComment != null ? x.ParentComment.PublicId : null
               })
               .ToListAsync(ct);

          List<FeedReactionProjection> reactionRows = await _db.SocialPostReactions
               .AsNoTracking()
               .Where(x => postIds.Contains(x.SocialPostId))
               .Select(x => new FeedReactionProjection
               {
                    SocialPostId = x.SocialPostId,
                    AppUserId = x.AppUserId,
                    ReactionType = x.ReactionType
               })
               .ToListAsync(ct);

          Dictionary<int, FeedAuthorProjection> authors = await _db.AppUsers
               .AsNoTracking()
               .Where(x => posts.Select(p => p.AuthorAppUserId).Contains(x.AppUserId))
               .Select(x => new FeedAuthorProjection
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

          Dictionary<int, FeedReactionProjection> currentUserReactionByPost = currentAppUserId.HasValue
               ? reactionRows
                    .Where(x => x.AppUserId == currentAppUserId.Value)
                    .ToDictionary(x => x.SocialPostId, x => x)
               : [];

          Dictionary<int, FeedCommentProjection> topCommentByPost = commentRows
               .GroupBy(x => x.SocialPostId)
               .ToDictionary(
                    x => x.Key,
                    x => x.OrderByDescending(y => y.CreateDate)
                          .ThenByDescending(y => y.SocialPostCommentId)
                          .First()
               );

          List<SocialFeedItemDto> items = posts.Select(post =>
          {
               FeedAuthorProjection author = authors[post.AuthorAppUserId];

               topCommentByPost.TryGetValue(post.SocialPostId, out FeedCommentProjection? topComment);
               currentUserReactionByPost.TryGetValue(post.SocialPostId, out FeedReactionProjection? currentReaction);

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
                              CommentPublicId = topComment.CommentPublicId,
                              AuthorPublicId = topComment.AuthorPublicId,
                              AuthorHandle = topComment.AuthorHandle,
                              AuthorDisplayName = topComment.AuthorDisplayName,
                              Body = topComment.Body,
                              CreateDate = topComment.CreateDate,
                              ParentCommentPublicId = topComment.ParentCommentPublicId
                         },
                    TopCommentTimestamp = topComment?.CreateDate
               };
          }).ToList();

          SocialFeedItemDto last = items[^1];
          SocialPost lastPost = posts[^1];
          string nextPageToken = SocialPageTokenParser.Encode(last.CreateDate, lastPost.SocialPostId);

          return new SocialFeedPageDto
          {
               Items = items,
               HasMore = hasMore,
               NextPageToken = hasMore ? nextPageToken : null
          };
     }
}
