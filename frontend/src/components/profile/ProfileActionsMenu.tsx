import { useState } from "react";
import { MoreHorizontal, RefreshCw, Link as LinkIcon, Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { profileScrapingService } from "@/services/profileScraping";

type ProfileActionsMenuProps = {
  isMe?: boolean;
  handle: string;
};

export const ProfileActionsMenu = ({ isMe = false, handle }: ProfileActionsMenuProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);

  const handleCopyProfileLink = async () => {
    const profileUrl = `${window.location.origin}/u/${handle}`;

    try {
      await navigator.clipboard.writeText(profileUrl);
      toast({
        title: "Profile link copied",
        description: "You can now share this profile page.",
      });
    } catch {
      toast({
        title: "Could not copy profile link",
        description: "Try again or copy the URL manually.",
        variant: "destructive",
      });
    } finally {
      setOpen(false);
    }
  };

  const handleQueueSteamUpdate = async () => {
    setIsQueueing(true);

    try {
      await profileScrapingService.queueCurrentUserUpdate();
      toast({
        title: "Profile refresh queued",
        description: "Refreshing achievements from the user's connected platforms.",
      });
      setOpen(false);
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        "Could not queue a profile refresh.";
      toast({
        title: "Could not queue profile refresh",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsQueueing(false);
    }
  };

  const menuItemClassName =
    "flex w-full items-start gap-3 rounded-2xl border border-transparent px-3 py-3 text-left text-sm text-app-text transition-colors hover:border-app-border hover:bg-app-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="relative">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-11 w-11 rounded-full border border-app-border bg-app-panel/95 text-app-text shadow-md shadow-app-border backdrop-blur-sm transition-colors hover:bg-app-panel2 focus-visible:ring-2 focus-visible:ring-brand/40"
            aria-label="Profile actions"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
          </Button>
        </DialogTrigger>

        <DialogContent className="border-app-border bg-app-panel p-0 text-app-text shadow-md shadow-app-border sm:max-w-md">
          <DialogTitle className="sr-only">Profile actions</DialogTitle>

          <div className="space-y-2 p-3 pr-12 pt-5">
            <button type="button" className={menuItemClassName} onClick={handleCopyProfileLink}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-app-bg text-app-muted">
                <LinkIcon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="flex flex-col">
                <span className="font-medium text-app-text">Copy profile link</span>
                <span className="text-xs text-app-muted">Share this profile page</span>
              </span>
            </button>

            {isMe ? (
              <button
                type="button"
                className={menuItemClassName}
                onClick={() => {
                  navigate("/settings");
                  setOpen(false);
                }}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-app-bg text-app-muted">
                  <SettingsIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="flex flex-col">
                  <span className="font-medium text-app-text">Settings</span>
                  <span className="text-xs text-app-muted">
                    Manage your profile details and preferences
                  </span>
                </span>
              </button>
            ) : null}

            {isMe ? (
              <button
                type="button"
                className={menuItemClassName}
                onClick={handleQueueSteamUpdate}
                disabled={isQueueing}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-app-bg text-app-muted">
                  <RefreshCw
                    className={`h-4 w-4 ${isQueueing ? "animate-spin" : ""}`}
                    aria-hidden="true"
                  />
                </span>
                <span className="flex flex-col">
                  <span className="font-medium text-app-text">
                    {isQueueing ? "Queueing profile refresh..." : "Queue Profile Refresh"}
                  </span>
                  <span className="text-xs text-app-muted">
                    Refresh the achievements from the user&apos;s connected platforms
                  </span>
                </span>
              </button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
