import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { Comment, Post, PostAttachment, ReactionType } from "@/types/post";

type BackendAttachmentType = 1 | 2;
type BackendReactionType = 1 | null;

type SocialFeedAttachmentResponse = {
  attachmentType: BackendAttachmentType;
  url: string;
  caption?: string | null;
  displayOrder?: number;
};

type SocialCommentResponse = {
  commentPublicId: string;
  authorPublicId: string;
  authorHandle?: string | null;
  authorDisplayName?: string | null;
  authorAvatarUrl?: string | null;
  body: string;
  createDate: string;
  parentCommentPublicId?: string | null;
  replies?: SocialCommentResponse[];
};

type SocialFeedItemResponse = {
  postPublicId: string;
  authorPublicId: string;
  authorHandle?: string | null;
  authorDisplayName?: string | null;
  authorAvatarUrl?: string | null;
  createDate: string;
  content?: string | null;
  attachments: SocialFeedAttachmentResponse[];
  commentCount: number;
  reactionCount: number;
  topComment?: SocialCommentResponse | null;
  topCommentTimestamp?: string | null;
  currentUserReaction?: BackendReactionType;
};

type SocialFeedPageResponse = {
  items: SocialFeedItemResponse[];
  nextPageToken?: string | null;
  hasMore: boolean;
};

export type FeedPage = {
  items: Post[];
  nextPageToken: string | null;
  hasMore: boolean;
};

export type GetFeedRequest = {
  pageSize?: number;
  pageToken?: string | null;
};

export type SocialAuthorOverrides = Record<
  string,
  {
    avatarUrl?: string | null;
    displayName?: string | null;
    handle?: string | null;
  }
>;

const mapAttachmentType = (attachmentType: BackendAttachmentType): PostAttachment["attachmentType"] =>
  attachmentType === 1 ? "image" : "embed";

const mapReactionType = (
  reactionType?: BackendReactionType
): ReactionType | null => (reactionType === 1 ? "like" : null);

const mapComment = (
  comment: SocialCommentResponse,
  authorOverrides?: SocialAuthorOverrides
): Comment => ({
  commentID: 0,
  publicId: comment.commentPublicId,
  author: {
    userID: 0,
    publicId: comment.authorPublicId,
    displayName:
      authorOverrides?.[comment.authorPublicId]?.displayName ??
      comment.authorDisplayName ??
      "Unknown user",
    handle:
      authorOverrides?.[comment.authorPublicId]?.handle?.replace(/^@/, "") ??
      comment.authorHandle?.replace(/^@/, "") ??
      "unknown",
    avatarUrl:
      authorOverrides?.[comment.authorPublicId]?.avatarUrl ??
      comment.authorAvatarUrl ??
      null,
  },
  content: {
    text: comment.body,
  },
  createdAt: {
    createdAt: comment.createDate,
  },
  replies: (comment.replies ?? []).map((reply) => mapComment(reply, authorOverrides)),
});

const mapFeedItem = (
  item: SocialFeedItemResponse,
  authorOverrides?: SocialAuthorOverrides
): Post => ({
  postID: 0,
  publicId: item.postPublicId,
  author: {
    userID: 0,
    publicId: item.authorPublicId,
    displayName:
      authorOverrides?.[item.authorPublicId]?.displayName ??
      item.authorDisplayName ??
      "Unknown user",
    handle:
      authorOverrides?.[item.authorPublicId]?.handle?.replace(/^@/, "") ??
      item.authorHandle?.replace(/^@/, "") ??
      "unknown",
    avatarUrl:
      authorOverrides?.[item.authorPublicId]?.avatarUrl ??
      item.authorAvatarUrl ??
      null,
  },
  content: {
    text: item.content ?? "",
  },
  metadata: {
    createdAt: item.createDate,
    updatedAt: null,
  },
  likes: {
    count: item.reactionCount,
    users: [],
    userHasLiked: item.currentUserReaction === 1,
  },
  attachments: (item.attachments ?? []).map((attachment) => ({
    attachmentType: mapAttachmentType(attachment.attachmentType),
    url: attachment.url,
    caption: attachment.caption ?? null,
    displayOrder: attachment.displayOrder ?? 0,
  })),
  commentCount: item.commentCount,
  reactionCount: item.reactionCount,
  currentUserReaction: mapReactionType(item.currentUserReaction),
  topComment: item.topComment ? mapComment(item.topComment, authorOverrides) : null,
});

export const feedService = {
  async getFeed(
    request: GetFeedRequest = {},
    authorOverrides?: SocialAuthorOverrides
  ): Promise<FeedPage> {
    const params = {
      pageSize: request.pageSize,
      pageToken: request.pageToken ?? undefined,
    };

    console.log("[feed-service] fetching feed", params);

    const response = await api.get<SocialFeedPageResponse>(endpoints.social.feed, {
      params,
    });

    const mapped: FeedPage = {
      items: response.data.items.map((item) => mapFeedItem(item, authorOverrides)),
      nextPageToken: response.data.nextPageToken ?? null,
      hasMore: response.data.hasMore,
    };

    console.log("[feed-service] feed mapped", {
      itemCount: mapped.items.length,
      hasMore: mapped.hasMore,
      nextPageToken: mapped.nextPageToken,
    });

    return mapped;
  },

  async getFeedByUser(
    authorPublicId: string,
    request: GetFeedRequest = {},
    authorOverrides?: SocialAuthorOverrides
  ): Promise<FeedPage> {
    const params = {
      pageSize: request.pageSize,
      pageToken: request.pageToken ?? undefined,
    };

    console.log("[feed-service] fetching user feed", {
      authorPublicId,
      ...params,
    });

    const response = await api.get<SocialFeedPageResponse>(
      endpoints.social.feedByUser(authorPublicId),
      {
        params,
      }
    );

    const mapped: FeedPage = {
      items: response.data.items.map((item) => mapFeedItem(item, authorOverrides)),
      nextPageToken: response.data.nextPageToken ?? null,
      hasMore: response.data.hasMore,
    };

    console.log("[feed-service] user feed mapped", {
      authorPublicId,
      itemCount: mapped.items.length,
      hasMore: mapped.hasMore,
      nextPageToken: mapped.nextPageToken,
    });

    return mapped;
  },
} as const;
