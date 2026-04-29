import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  ImageIcon,
  Loader2,
  MessageCircle,
  Quote,
} from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  postService,
  type SocialCommentResponse,
} from "@/services/posts";
import type { Comment as CommentModel, Post as PostModel } from "@/types/post";

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

const getAuthorProfilePath = (author: CommentModel["author"] | PostModel["author"]) =>
  `/u/${author.handle || author.publicId}`;

const mapComment = (comment: SocialCommentResponse): CommentModel => ({
  commentID: 0,
  publicId: comment.commentPublicId,
  author: {
    userID: 0,
    publicId: comment.authorPublicId,
    displayName: comment.authorDisplayName ?? "Unknown user",
    handle: comment.authorHandle?.replace(/^@/, "") ?? "unknown",
    avatarUrl: comment.authorAvatarUrl ?? null,
  },
  content: {
    text: comment.body,
  },
  createdAt: {
    createdAt: comment.createDate,
  },
  replies: (comment.replies ?? []).map(mapComment),
});

type CommentThreadProps = {
  comment: CommentModel;
  depth?: number;
};

const CommentThread = ({ comment, depth = 0 }: CommentThreadProps) => (
  <div className={cn("space-y-3 rounded-xl border border-app-border bg-app-bg/60 p-3", depth > 0 ? "ml-6" : "")}>
    <div className="flex items-start gap-3">
      <Link
        to={getAuthorProfilePath(comment.author)}
        className="shrink-0 transition-transform hover:scale-[1.02]"
        aria-label={`Open ${comment.author.displayName}'s profile`}
      >
        <Avatar className="h-10 w-10 border border-app-border">
          <AvatarImage
            src={comment.author.avatarUrl ?? undefined}
            alt={`${comment.author.displayName} avatar`}
          />
          <AvatarFallback className="bg-app-panel text-app-text">
            {getInitials(comment.author.displayName)}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            to={getAuthorProfilePath(comment.author)}
            className="font-medium text-app-text hover:underline"
          >
            {comment.author.displayName}
          </Link>
          <Link
            to={getAuthorProfilePath(comment.author)}
            className="text-xs text-app-muted hover:text-app-text"
          >
            @{comment.author.handle}
          </Link>
          <span className="text-xs text-app-muted">
            {formatDate(comment.createdAt.createdAt)}
          </span>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-app-text">
          {comment.content.text}
        </p>
      </div>
    </div>

    {(comment.replies ?? []).length > 0 ? (
      <div className="space-y-3">
        {comment.replies?.map((reply) => (
          <CommentThread key={reply.publicId ?? reply.commentID} comment={reply} depth={depth + 1} />
        ))}
      </div>
    ) : null}
  </div>
);

export const Post = ({ post }: PostProps) => {
  const { isAuthenticated, needsProfileSetup, loginWithSteam } = useAuth();
  const [reactionCount, setReactionCount] = useState(post.reactionCount ?? post.likes.count);
  const [commentCount, setCommentCount] = useState(
    post.commentCount ?? (post.topComment ? 1 : 0)
  );
  const [currentUserReaction, setCurrentUserReaction] = useState(post.currentUserReaction);
  const [topComment, setTopComment] = useState(post.topComment ?? null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<CommentModel[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingLike, setIsSubmittingLike] = useState(false);

  useEffect(() => {
    setReactionCount(post.reactionCount ?? post.likes.count);
    setCommentCount(post.commentCount ?? (post.topComment ? 1 : 0));
    setCurrentUserReaction(post.currentUserReaction);
    setTopComment(post.topComment ?? null);
    setComments([]);
    setCommentsLoaded(false);
    setCommentBody("");
    setCommentsOpen(false);
  }, [post]);

  const attachments = post.attachments ?? [];
  const imageAttachments = attachments.filter((item) => item.attachmentType === "image");
  const embedAttachments = attachments.filter((item) => item.attachmentType === "embed");
  const fallbackImage = post.content.imageUrl
    ? [{ attachmentType: "image" as const, url: post.content.imageUrl, caption: null, displayOrder: 0 }]
    : [];
  const displayAttachments =
    imageAttachments.length > 0 || embedAttachments.length > 0
      ? [...attachments].sort(
          (left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0)
        )
      : fallbackImage;
  const canSubmitComment =
    !isSubmittingComment &&
    isAuthenticated &&
    !needsProfileSetup &&
    commentBody.trim().length > 0;
  const profilePath = getAuthorProfilePath(post.author);

  const openComments = async () => {
    console.log("[post] comments dialog requested", {
      postPublicId: post.publicId ?? null,
      commentsLoaded,
    });

    setCommentsOpen(true);

    if (commentsLoaded || !post.publicId) {
      return;
    }

    setIsLoadingComments(true);

    try {
      const response = await postService.getComments(post.publicId);
      const mappedComments = response.items.map(mapComment);
      setComments(mappedComments);
      setCommentsLoaded(true);

      console.log("[post] comments loaded", {
        postPublicId: post.publicId,
        itemCount: mappedComments.length,
      });
    } catch (error: any) {
      console.log("[post] failed to load comments", {
        postPublicId: post.publicId ?? null,
        error,
      });
      toast({
        title: "Could not load comments",
        description:
          error?.response?.data?.error ||
          error?.message ||
          "Comments could not be loaded right now.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleLike = async () => {
    console.log("[post] like requested", {
      postPublicId: post.publicId ?? null,
      currentUserReaction,
      isAuthenticated,
      needsProfileSetup,
    });

    if (!isAuthenticated) {
      loginWithSteam();
      return;
    }

    if (needsProfileSetup) {
      toast({
        title: "Finish profile setup first",
        description: "Set your handle and display name before reacting to posts.",
        variant: "destructive",
      });
      return;
    }

    if (!post.publicId || currentUserReaction === "like" || isSubmittingLike) {
      return;
    }

    setIsSubmittingLike(true);

    try {
      await postService.setLike(post.publicId);
      setCurrentUserReaction("like");
      setReactionCount((current) => current + 1);

      console.log("[post] like applied", { postPublicId: post.publicId });
    } catch (error: any) {
      console.log("[post] failed to apply like", {
        postPublicId: post.publicId,
        error,
      });
      toast({
        title: "Could not add reaction",
        description:
          error?.response?.data?.error ||
          error?.message ||
          "The like reaction could not be saved.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingLike(false);
    }
  };

  const handleCommentSubmit = async () => {
    console.log("[post] comment submit requested", {
      postPublicId: post.publicId ?? null,
      isAuthenticated,
      needsProfileSetup,
      bodyLength: commentBody.trim().length,
    });

    if (!isAuthenticated) {
      loginWithSteam();
      return;
    }

    if (needsProfileSetup) {
      toast({
        title: "Finish profile setup first",
        description: "Set your handle and display name before commenting on posts.",
        variant: "destructive",
      });
      return;
    }

    if (!post.publicId || !canSubmitComment) {
      return;
    }

    setIsSubmittingComment(true);

    try {
      const created = await postService.createComment(post.publicId, {
        body: commentBody.trim(),
      });

      const mappedComment = mapComment(created);

      setComments((current) => [...current, mappedComment]);
      setCommentsLoaded(true);
      setCommentCount((current) => current + 1);
      setTopComment(mappedComment);
      setCommentBody("");

      console.log("[post] comment created", {
        postPublicId: post.publicId,
        commentPublicId: created.commentPublicId,
      });
    } catch (error: any) {
      console.log("[post] failed to create comment", {
        postPublicId: post.publicId,
        error,
      });
      toast({
        title: "Could not post comment",
        description:
          error?.response?.data?.error ||
          error?.message ||
          "The comment could not be posted.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const reactionLabel =
    currentUserReaction === "like" ? "Liked" : `${reactionCount} reaction${reactionCount === 1 ? "" : "s"}`;

  const commentsDescription = useMemo(() => {
    if (commentCount === 0) {
      return "No comments yet. Start the conversation.";
    }

    return `${commentCount} comment${commentCount === 1 ? "" : "s"} on this post.`;
  }, [commentCount]);

  return (
    <>
      <article className="space-y-4 rounded-xl border border-app-border bg-app-bg p-4 shadow-sm shadow-app-border/40">
        <header className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <Link
              to={profilePath}
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
                  to={profilePath}
                  className="truncate font-semibold text-app-text hover:underline"
                >
                  {post.author.displayName}
                </Link>
                <Link
                  to={profilePath}
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

        {topComment ? (
          <div className="rounded-xl border border-app-border bg-app-panel px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-app-muted">
              <Quote className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Top comment</span>
            </div>
            <div className="mt-3 flex items-start gap-3">
              <Link
                to={getAuthorProfilePath(topComment.author)}
                className="shrink-0 transition-transform hover:scale-[1.02]"
                aria-label={`Open ${topComment.author.displayName}'s profile`}
              >
                <Avatar className="h-10 w-10 border border-app-border">
                  <AvatarImage
                    src={topComment.author.avatarUrl ?? undefined}
                    alt={`${topComment.author.displayName} avatar`}
                  />
                  <AvatarFallback className="bg-app-bg text-app-text">
                    {getInitials(topComment.author.displayName)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <Link
                  to={getAuthorProfilePath(topComment.author)}
                  className="text-sm font-medium text-app-text hover:underline"
                >
                  {topComment.author.displayName}
                </Link>
                <p className="mt-1 text-sm text-app-muted">
                  {topComment.content.text}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <footer className="flex flex-wrap items-center gap-3 border-t border-app-border pt-4 text-sm text-app-muted">
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-app-border bg-app-panel px-3 py-1.5 transition-colors hover:bg-app-panel2 disabled:cursor-not-allowed disabled:opacity-70",
              currentUserReaction === "like" ? "text-app-text" : ""
            )}
            onClick={() => void handleLike()}
            disabled={isSubmittingLike}
          >
            <Heart
              className={cn(
                "h-4 w-4",
                currentUserReaction === "like" ? "fill-current text-app-text" : ""
              )}
            />
            <span>{isSubmittingLike ? "Saving..." : reactionLabel}</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-app-border bg-app-panel px-3 py-1.5 transition-colors hover:bg-app-panel2"
            onClick={() => void openComments()}
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span>{commentCount} comment{commentCount === 1 ? "" : "s"}</span>
          </button>
        </footer>
      </article>

      <Dialog open={commentsOpen} onOpenChange={setCommentsOpen}>
        <DialogContent className="border-app-border bg-app-panel text-app-text shadow-xl shadow-app-border sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
            <DialogDescription className="text-app-muted">
              {commentsDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-2xl border border-app-border bg-app-bg/50 p-4">
              <p className="mb-3 text-sm font-medium text-app-text">Add a comment</p>
              <Textarea
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value)}
                placeholder="Write your comment here."
                className="min-h-28 border-app-border bg-app-bg text-app-text placeholder:text-app-muted"
              />
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  onClick={() => void handleCommentSubmit()}
                  disabled={!canSubmitComment}
                >
                  {isSubmittingComment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Posting...
                    </>
                  ) : (
                    "Post comment"
                  )}
                </Button>
              </div>
            </div>

            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {isLoadingComments ? (
                <div className="flex justify-center py-10">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : comments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-app-border px-4 py-8 text-center text-sm text-app-muted">
                  No comments yet.
                </div>
              ) : (
                comments.map((comment) => (
                  <CommentThread key={comment.publicId ?? comment.commentID} comment={comment} />
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
