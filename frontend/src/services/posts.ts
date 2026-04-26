import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export type CreatePostAttachmentRequest = {
  attachmentType: 1 | 2;
  url: string;
  caption?: string | null;
};

export type CreatePostRequest = {
  content?: string | null;
  attachments: CreatePostAttachmentRequest[];
};

export type CreateCommentRequest = {
  body: string;
  parentCommentPublicId?: string | null;
};

type CreatePostResponse = {
  postPublicId: string;
};

type UploadImageResponse = {
  url: string;
};

export type SocialCommentResponse = {
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

export type SocialCommentPageResponse = {
  items: SocialCommentResponse[];
  nextPageToken?: string | null;
  hasMore: boolean;
};

export const postService = {
  async uploadImage(file: File): Promise<string> {
    console.log("[post-service] uploading image", {
      fileName: file.name,
      size: file.size,
      type: file.type,
    });

    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<UploadImageResponse>(
      endpoints.social.uploadImage,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("[post-service] image uploaded", {
      fileName: file.name,
      url: response.data.url,
    });

    return response.data.url;
  },

  async createPost(request: CreatePostRequest): Promise<string> {
    console.log("[post-service] creating post", {
      contentLength: request.content?.length ?? 0,
      attachmentCount: request.attachments.length,
      attachments: request.attachments.map((attachment) => ({
        attachmentType: attachment.attachmentType,
        url: attachment.url,
        hasCaption: Boolean(attachment.caption),
      })),
    });

    const response = await api.post<CreatePostResponse>(
      endpoints.social.createPost,
      request
    );

    console.log("[post-service] post created", {
      postPublicId: response.data.postPublicId,
    });

    return response.data.postPublicId;
  },

  async setLike(postPublicId: string): Promise<void> {
    console.log("[post-service] setting like reaction", { postPublicId });

    await api.put(endpoints.social.setReaction(postPublicId), {
      reactionType: 1,
    });
  },

  async getComments(postPublicId: string): Promise<SocialCommentPageResponse> {
    console.log("[post-service] fetching comments", { postPublicId });

    const response = await api.get<SocialCommentPageResponse>(
      endpoints.social.postComments(postPublicId)
    );

    console.log("[post-service] comments fetched", {
      postPublicId,
      itemCount: response.data.items.length,
      hasMore: response.data.hasMore,
    });

    return response.data;
  },

  async createComment(
    postPublicId: string,
    request: CreateCommentRequest
  ): Promise<SocialCommentResponse> {
    console.log("[post-service] creating comment", {
      postPublicId,
      bodyLength: request.body.length,
      parentCommentPublicId: request.parentCommentPublicId ?? null,
    });

    const response = await api.post<SocialCommentResponse>(
      endpoints.social.createComment(postPublicId),
      request
    );

    console.log("[post-service] comment created", {
      postPublicId,
      commentPublicId: response.data.commentPublicId,
    });

    return response.data;
  },
} as const;
