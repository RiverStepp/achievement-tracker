import { User } from "./models";

export interface Author {
    userID: number;
    publicId?: string;
    displayName: string;
    handle: string;
    avatarUrl: string | null;
}

export type AttachmentType = "image" | "embed";

export interface PostAttachment {
    attachmentType: AttachmentType;
    url: string;
    caption?: string | null;
    displayOrder?: number;
}

export type ReactionType = "like";

export interface PostContent {
    text: string;
    imageUrl?: string | null;
}
export interface PostMetadata {
    createdAt: string; // ISO 8601 date string
    updatedAt?: string | null; // ISO 8601 date string
}
export interface Likes {
    count: number;
    users: User[];
    userHasLiked: boolean;
}
export interface Comment {
    commentID: number;
    publicId?: string;
    author: Author;
    content: PostContent;
    createdAt: PostMetadata; // ISO 8601 date string
    replies?: Comment[];
}
export interface Post {
    postID: number;
    publicId?: string;
    author: Author;
    content: PostContent;
    metadata: PostMetadata;
    likes: Likes;
    attachments?: PostAttachment[];
    commentCount?: number;
    reactionCount?: number;
    currentUserReaction?: ReactionType | null;
    topComment?: Comment | null;
}
