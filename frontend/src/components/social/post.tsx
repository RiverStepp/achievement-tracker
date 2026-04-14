import { Link } from "react-router-dom";
import { Heart, ImageIcon, MessageCircle, Quote } from "lucide-react";

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
  const attachments = post.attachments ?? [];
  const imageAttachments = attachments.filter((item) => item.attachmentType === "image");
  const embedAttachments = attachments.filter((item) => item.attachmentType === "embed");
  const fallbackImage = post.content.imageUrl
    ? [{ attachmentType: "image" as const, url: post.content.imageUrl, caption: null, displayOrder: 0 }]
    : [];
  const displayAttachments = imageAttachments.length > 0 || embedAttachments.length > 0
    ? [...attachments].sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0))
    : fallbackImage;
  const reactionCount = post.reactionCount ?? post.likes.count;
  const commentCount = post.commentCount ?? (post.topComment ? 1 : 0);

  return (
    <article className="space-y-4 rounded-xl border border-app-border bg-app-bg p-4 shadow-sm shadow-app-border/40">
        <header className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
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

          {displayAttachments.length > 0 ? (
            <div className="space-y-3">
              {displayAttachments.map((attachment, index) =>
                attachment.attachmentType === "image" ? (
                  <figure
                    key={`${attachment.url}-${index}`}
                    className="overflow-hidden rounded-xl border border-app-border bg-app-panel"
                  >
                    <img
                      src={attachment.url}
                      alt={attachment.caption ?? ""}
                      className="h-64 w-full object-cover"
                    />
                    {attachment.caption ? (
                      <figcaption className="border-t border-app-border px-3 py-2 text-xs text-app-muted">
                        {attachment.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                ) : (
                  <div
                    key={`${attachment.url}-${index}`}
                    className="rounded-xl border border-app-border bg-app-panel px-4 py-3"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-app-text">
                      <ImageIcon className="h-4 w-4 text-app-muted" aria-hidden="true" />
                      <span>Embedded media</span>
                    </div>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block truncate text-sm text-app-muted underline underline-offset-2 hover:text-app-text"
                    >
                      {attachment.url}
                    </a>
                    {attachment.caption ? (
                      <p className="mt-2 text-xs text-app-muted">{attachment.caption}</p>
                    ) : null}
                  </div>
                )
              )}
            </div>
          ) : null}
        </div>

        {post.topComment ? (
          <div className="rounded-xl border border-app-border bg-app-panel px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-app-muted">
              <Quote className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Top comment</span>
            </div>
            <p className="mt-2 text-sm font-medium text-app-text">
              {post.topComment.author.displayName}
            </p>
            <p className="mt-1 text-sm text-app-muted">{post.topComment.content.text}</p>
          </div>
        ) : null}

        <footer className="flex flex-wrap items-center gap-3 border-t border-app-border pt-4 text-sm text-app-muted">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-app-border bg-app-panel px-3 py-1.5 transition-colors hover:bg-app-panel2"
          >
            <Heart
              className={`h-4 w-4 ${
                post.currentUserReaction === "like" || post.likes.userHasLiked
                  ? "fill-current text-app-text"
                  : ""
              }`}
            />
            <span>{reactionCount} reaction{reactionCount === 1 ? "" : "s"}</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-app-border bg-app-panel px-3 py-1.5 transition-colors hover:bg-app-panel2"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span>{commentCount} comment{commentCount === 1 ? "" : "s"}</span>
          </button>
        </footer>
    </article>
  );
};
