import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/format";
import type { Post as PostModel } from "@/types/post";

type PostProps = {
  post: PostModel;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const Post = ({ post }: PostProps) => {
  return (
    <article className="space-y-4 rounded-lg border border-app-border bg-app-bg p-4">
        <header className="flex items-start gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Link
              to={`/u/${post.author.handle}`}
              className="shrink-0 transition-transform hover:scale-[1.02]"
              aria-label={`Open ${post.author.displayName}'s profile`}
            >
              <Avatar className="h-12 w-12 border border-app-border">
                <AvatarImage
                  src={post.author.avatarUrl ?? undefined}
                  alt={`${post.author.displayName} avatar`}
                />
                <AvatarFallback className="bg-app-panel text-app-text">
                  {getInitials(post.author.displayName)}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Link
                  to={`/u/${post.author.handle}`}
                  className="truncate font-semibold text-app-text hover:underline"
                >
                  {post.author.displayName}
                </Link>
                <Link
                  to={`/u/${post.author.handle}`}
                  className="truncate text-sm text-app-muted hover:text-app-text"
                >
                  @{post.author.handle}
                </Link>
              </div>
              <p className="mt-1 text-xs text-app-muted">
                {formatDate(post.metadata.createdAt)}
                {post.metadata.updatedAt ? " (edited)" : ""}
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-4">
          <p className="whitespace-pre-wrap text-sm leading-7 text-app-text">
            {post.content.text}
          </p>

          {post.content.imageUrl ? (
            <div className="overflow-hidden rounded-lg border border-app-border">
              <img
                src={post.content.imageUrl}
                alt=""
                className="h-64 w-full object-cover"
              />
            </div>
          ) : null}
        </div>

        <footer className="flex items-center gap-2 border-t border-app-border pt-4 text-sm text-app-muted">
          <div className="flex items-center gap-2 text-sm text-app-muted">
            <Heart
              className={`h-4 w-4 ${
                post.likes.userHasLiked ? "fill-current text-app-text" : ""
              }`}
            />
            <span>{post.likes.count} likes</span>
          </div>
        </footer>
    </article>
  );
};
