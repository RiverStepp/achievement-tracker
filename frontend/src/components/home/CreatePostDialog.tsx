import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Link2, Loader2, PencilLine, Trash2 } from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { postService, type CreatePostAttachmentRequest } from "@/services/posts";

type CreatePostDialogProps = {
  onPostCreated?: () => void;
};

type PendingImageAttachment = {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
};

type EmbedAttachmentDraft = {
  id: string;
  url: string;
  caption: string;
};

const MAX_CONTENT_LENGTH = 4000;

export const CreatePostDialog = ({ onPostCreated }: CreatePostDialogProps) => {
  const { isAuthenticated, isLoading, needsProfileSetup, loginWithSteam } = useAuth();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [imageAttachments, setImageAttachments] = useState<PendingImageAttachment[]>([]);
  const [embedAttachments, setEmbedAttachments] = useState<EmbedAttachmentDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageAttachmentsRef = useRef<PendingImageAttachment[]>([]);

  useEffect(() => {
    imageAttachmentsRef.current = imageAttachments;
  }, [imageAttachments]);

  useEffect(() => {
    return () => {
      imageAttachmentsRef.current.forEach((attachment) => {
        URL.revokeObjectURL(attachment.previewUrl);
      });
    };
  }, []);

  const trimmedContent = content.trim();
  const validEmbedAttachments = useMemo(
    () =>
      embedAttachments
        .map((attachment) => ({
          ...attachment,
          url: attachment.url.trim(),
          caption: attachment.caption.trim(),
        }))
        .filter((attachment) => attachment.url.length > 0),
    [embedAttachments]
  );
  const canSubmit =
    !isSubmitting &&
    isAuthenticated &&
    !needsProfileSetup &&
    (trimmedContent.length > 0 ||
      imageAttachments.length > 0 ||
      validEmbedAttachments.length > 0) &&
    trimmedContent.length <= MAX_CONTENT_LENGTH;

  const resetForm = () => {
    console.log("[create-post-dialog] resetting form", {
      imageCount: imageAttachments.length,
      embedCount: embedAttachments.length,
    });

    imageAttachments.forEach((attachment) => {
      URL.revokeObjectURL(attachment.previewUrl);
    });

    setContent("");
    setImageAttachments([]);
    setEmbedAttachments([]);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    console.log("[create-post-dialog] dialog state changed", { open: nextOpen });
    setOpen(nextOpen);

    if (!nextOpen && !isSubmitting) {
      resetForm();
    }
  };

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    console.log("[create-post-dialog] image files selected", {
      count: files.length,
      files: files.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      })),
    });

    const nextAttachments = files.map<PendingImageAttachment>((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      caption: "",
    }));

    setImageAttachments((current) => [...current, ...nextAttachments]);
    event.target.value = "";
  };

  const handleRemoveImage = (id: string) => {
    console.log("[create-post-dialog] removing image attachment", { id });

    setImageAttachments((current) => {
      const attachment = current.find((item) => item.id === id);
      if (attachment) {
        URL.revokeObjectURL(attachment.previewUrl);
      }

      return current.filter((item) => item.id !== id);
    });
  };

  const handleAddEmbed = () => {
    const id = crypto.randomUUID();
    console.log("[create-post-dialog] adding embed attachment row", { id });
    setEmbedAttachments((current) => [...current, { id, url: "", caption: "" }]);
  };

  const handleRemoveEmbed = (id: string) => {
    console.log("[create-post-dialog] removing embed attachment row", { id });
    setEmbedAttachments((current) => current.filter((attachment) => attachment.id !== id));
  };

  const handleSubmit = async () => {
    console.log("[create-post-dialog] submit requested", {
      isAuthenticated,
      needsProfileSetup,
      contentLength: trimmedContent.length,
      imageCount: imageAttachments.length,
      embedCount: validEmbedAttachments.length,
    });

    if (!isAuthenticated) {
      toast({
        title: "Log in required",
        description: "Sign in with Steam before creating a post.",
        variant: "destructive",
      });
      return;
    }

    if (needsProfileSetup) {
      toast({
        title: "Finish profile setup first",
        description: "Set your handle and display name before posting to the feed.",
        variant: "destructive",
      });
      return;
    }

    if (!canSubmit) {
      toast({
        title: "Post is incomplete",
        description: "Add text or at least one attachment before posting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedImageAttachments: CreatePostAttachmentRequest[] = [];

      for (const attachment of imageAttachments) {
        console.log("[create-post-dialog] uploading image attachment", {
          id: attachment.id,
          fileName: attachment.file.name,
        });

        const url = await postService.uploadImage(attachment.file);
        uploadedImageAttachments.push({
          attachmentType: 1 as const,
          url,
          caption: attachment.caption.trim() || null,
        });
      }

      await postService.createPost({
        content: trimmedContent || null,
        attachments: [
          ...uploadedImageAttachments,
          ...validEmbedAttachments.map((attachment) => ({
            attachmentType: 2 as const,
            url: attachment.url,
            caption: attachment.caption || null,
          })),
        ],
      });

      toast({
        title: "Post published",
        description: "Your post was sent to the community feed.",
      });

      console.log("[create-post-dialog] post submit succeeded");
      resetForm();
      setOpen(false);
      onPostCreated?.();
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        "The post could not be published.";

      console.log("[create-post-dialog] post submit failed", {
        message,
        error,
      });

      toast({
        title: "Could not publish post",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerLabel = isAuthenticated ? "Create post" : "Log in to post";
  const triggerDisabled = isLoading;
  const helperText = !isAuthenticated
    ? "Sign in to share updates, images, and links."
    : needsProfileSetup
      ? "Complete your social identity before posting."
      : "Share an update with the community feed.";

  return (
    <div className="rounded-2xl border border-app-border bg-app-panel p-4 shadow-sm shadow-app-border/40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-app-muted">
            Community
          </p>
          <h2 className="mt-1 text-xl font-semibold text-app-text">Share a post</h2>
          <p className="mt-1 text-sm text-app-muted">{helperText}</p>
        </div>

        {!isAuthenticated ? (
          <Button
            type="button"
            onClick={() => {
              console.log("[create-post-dialog] login trigger clicked");
              loginWithSteam();
            }}
            disabled={triggerDisabled}
            className="min-w-40"
          >
            <PencilLine className="mr-2 h-4 w-4" aria-hidden="true" />
            {triggerLabel}
          </Button>
        ) : (
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button type="button" disabled={triggerDisabled || needsProfileSetup} className="min-w-40">
                <PencilLine className="mr-2 h-4 w-4" aria-hidden="true" />
                {triggerLabel}
              </Button>
            </DialogTrigger>

            <DialogContent className="border-app-border bg-app-panel text-app-text shadow-xl shadow-app-border sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create a post</DialogTitle>
                <DialogDescription className="text-app-muted">
                  Write a post, upload images, and attach external links.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="post-content" className="text-app-text">
                      Post text
                    </Label>
                    <span className="text-xs text-app-muted">
                      {trimmedContent.length}/{MAX_CONTENT_LENGTH}
                    </span>
                  </div>
                  <Textarea
                    id="post-content"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="What are you working on, unlocking, or sharing today?"
                    className="min-h-40 border-app-border bg-app-bg text-app-text placeholder:text-app-muted"
                    maxLength={MAX_CONTENT_LENGTH}
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <section className="space-y-3 rounded-2xl border border-app-border bg-app-bg/50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-app-text">Images</h3>
                        <p className="text-xs text-app-muted">
                          Upload screenshots or artwork to attach to the post.
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          console.log("[create-post-dialog] image picker opened");
                          fileInputRef.current?.click();
                        }}
                      >
                        <ImagePlus className="mr-2 h-4 w-4" aria-hidden="true" />
                        Add images
                      </Button>
                    </div>

                    <Input
                      id={fileInputId}
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileSelection}
                    />

                    {imageAttachments.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-app-border px-4 py-8 text-center text-sm text-app-muted">
                        No image attachments selected yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {imageAttachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="space-y-3 rounded-xl border border-app-border bg-app-panel p-3"
                          >
                            <img
                              src={attachment.previewUrl}
                              alt={attachment.file.name}
                              className="h-40 w-full rounded-lg object-cover"
                            />
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-app-text">
                                  {attachment.file.name}
                                </p>
                                <p className="text-xs text-app-muted">
                                  {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveImage(attachment.id)}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </div>
                            <Input
                              value={attachment.caption}
                              onChange={(event) => {
                                const nextCaption = event.target.value;
                                setImageAttachments((current) =>
                                  current.map((item) =>
                                    item.id === attachment.id
                                      ? { ...item, caption: nextCaption }
                                      : item
                                  )
                                );
                              }}
                              placeholder="Optional image caption"
                              className="border-app-border bg-app-bg text-app-text placeholder:text-app-muted"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="space-y-3 rounded-2xl border border-app-border bg-app-bg/50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-app-text">Embeds</h3>
                        <p className="text-xs text-app-muted">
                          Add external links that should appear as attachments.
                        </p>
                      </div>

                      <Button type="button" variant="outline" onClick={handleAddEmbed}>
                        <Link2 className="mr-2 h-4 w-4" aria-hidden="true" />
                        Add link
                      </Button>
                    </div>

                    {embedAttachments.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-app-border px-4 py-8 text-center text-sm text-app-muted">
                        No embed links added yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {embedAttachments.map((attachment, index) => (
                          <div
                            key={attachment.id}
                            className="space-y-3 rounded-xl border border-app-border bg-app-panel p-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-app-text">
                                Link attachment {index + 1}
                              </p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveEmbed(attachment.id)}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </div>
                            <Input
                              value={attachment.url}
                              onChange={(event) => {
                                const nextUrl = event.target.value;
                                setEmbedAttachments((current) =>
                                  current.map((item) =>
                                    item.id === attachment.id
                                      ? { ...item, url: nextUrl }
                                      : item
                                  )
                                );
                              }}
                              placeholder="https://example.com"
                              className="border-app-border bg-app-bg text-app-text placeholder:text-app-muted"
                            />
                            <Input
                              value={attachment.caption}
                              onChange={(event) => {
                                const nextCaption = event.target.value;
                                setEmbedAttachments((current) =>
                                  current.map((item) =>
                                    item.id === attachment.id
                                      ? { ...item, caption: nextCaption }
                                      : item
                                  )
                                );
                              }}
                              placeholder="Optional link caption"
                              className="border-app-border bg-app-bg text-app-text placeholder:text-app-muted"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Publishing...
                    </>
                  ) : (
                    "Publish post"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};
