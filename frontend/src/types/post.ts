import { User } from "./models";

export interface Author {
    userID: number;
    displayName: string;
    handle: string;
    avatarUrl: string | null;
}
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
    author: Author;
    content: PostContent;
    createdAt: PostMetadata; // ISO 8601 date string
}
export interface Post {
    postID: number;
    author: Author;
    content: PostContent;
    metadata: PostMetadata;
    likes: Likes;
}