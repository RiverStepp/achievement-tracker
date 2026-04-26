import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { AchievementIcon } from "@/components/achievments/AchievementIcon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { profileService } from "@/services/profile";
import type { ProfileAchievement } from "@/types/profile";

type PinnedAchievementsDialogProps = {
  achievements: ProfileAchievement[];
  onSaved?: () => void;
};

const MAX_PINNED_ACHIEVEMENTS = 10;

function getAchievementKey(achievement: ProfileAchievement) {
  return [
    achievement.id,
    achievement.achievement.id,
    achievement.game.id,
    achievement.unlockedAt,
  ].join("|");
}

export const PinnedAchievementsDialog = ({
  achievements,
  onSaved,
}: PinnedAchievementsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const sortedAchievements = useMemo(
    () =>
      [...achievements].sort((left, right) => {
        if (Boolean(left.isPinned) !== Boolean(right.isPinned)) {
          return left.isPinned ? -1 : 1;
        }

        return (
          new Date(right.unlockedAt).getTime() - new Date(left.unlockedAt).getTime()
        );
      }),
    [achievements]
  );

  const achievementByKey = useMemo(
    () =>
      new Map(sortedAchievements.map((achievement) => [getAchievementKey(achievement), achievement])),
    [sortedAchievements]
  );

  const initiallyPinnedKeys = useMemo(
    () =>
      sortedAchievements
        .filter((achievement) => achievement.isPinned)
        .map((achievement) => getAchievementKey(achievement)),
    [sortedAchievements]
  );

  useEffect(() => {
    if (open) {
      console.log("[pinned-achievements] dialog opened", {
        achievementCount: sortedAchievements.length,
        pinnedCount: initiallyPinnedKeys.length,
      });
      setSelectedKeys(initiallyPinnedKeys);
    }
  }, [initiallyPinnedKeys, open, sortedAchievements.length]);

  const selectedKeySet = useMemo(() => new Set(selectedKeys), [selectedKeys]);
  const initialPinnedKeySet = useMemo(
    () => new Set(initiallyPinnedKeys),
    [initiallyPinnedKeys]
  );

  const handleOpenChange = (nextOpen: boolean) => {
    console.log("[pinned-achievements] dialog state changed", { open: nextOpen });

    if (!nextOpen) {
      setSelectedKeys(initiallyPinnedKeys);
      setIsSaving(false);
    }

    setOpen(nextOpen);
  };

  const handleToggleAchievement = (achievement: ProfileAchievement) => {
    const key = getAchievementKey(achievement);
    const isSelected = selectedKeySet.has(key);

    console.log("[pinned-achievements] toggle clicked", {
      achievementName: achievement.achievement.name,
      steamAchievementId: achievement.steamAchievementId ?? null,
      key,
      isSelected,
      isPinned: Boolean(achievement.isPinned),
    });

    if (isSelected) {
      setSelectedKeys((current) => current.filter((currentKey) => currentKey !== key));
      return;
    }

    if (selectedKeys.length >= MAX_PINNED_ACHIEVEMENTS) {
      toast({
        title: "Pinned achievements limit reached",
        description: `You can pin up to ${MAX_PINNED_ACHIEVEMENTS} achievements.`,
        variant: "destructive",
      });
      return;
    }

    if (!achievement.steamAchievementId && !achievement.isPinned) {
      toast({
        title: "Achievement cannot be pinned yet",
        description:
          "This achievement is missing the identifier required by the current API.",
        variant: "destructive",
      });
      return;
    }

    setSelectedKeys((current) => [...current, key]);
  };

  const handleCancel = () => {
    console.log("[pinned-achievements] dialog cancelled");
    handleOpenChange(false);
  };

  const handleSave = async () => {
    const removedPinnedKeys = initiallyPinnedKeys.filter(
      (key) => !selectedKeySet.has(key)
    );

    if (removedPinnedKeys.length > 0) {
      console.log("[pinned-achievements] save blocked by unsupported unpin", {
        removedPinnedCount: removedPinnedKeys.length,
      });
      toast({
        title: "Removing pinned achievements is not available",
        description:
          "This screen can add new pins, but existing pins cannot be removed with the current API.",
        variant: "destructive",
      });
      return;
    }

    const addedAchievements = selectedKeys
      .filter((key) => !initialPinnedKeySet.has(key))
      .map((key) => achievementByKey.get(key))
      .filter((achievement): achievement is ProfileAchievement => Boolean(achievement));

    console.log("[pinned-achievements] saving selection", {
      selectedCount: selectedKeys.length,
      addedCount: addedAchievements.length,
    });

    if (addedAchievements.length === 0) {
      handleOpenChange(false);
      return;
    }

    setIsSaving(true);

    try {
      for (const achievement of addedAchievements) {
        if (!achievement.steamAchievementId) {
          throw new Error(
            `Missing steamAchievementId for ${achievement.achievement.name}`
          );
        }

        await profileService.pinAchievement(achievement.steamAchievementId);
      }

      toast({
        title: "Pinned achievements updated",
        description: "Your newly selected achievements have been pinned.",
      });
      handleOpenChange(false);
      onSaved?.();
    } catch (error: any) {
      console.log("[pinned-achievements] save failed", { error });
      toast({
        title: "Could not update pinned achievements",
        description:
          error?.response?.data?.error ||
          error?.message ||
          "The selected achievements could not be pinned.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="h-10 w-10 rounded-full border border-app-border bg-app-panel2 text-app-text hover:bg-app-bg"
        aria-label="Edit pinned achievements"
        onClick={() => handleOpenChange(true)}
      >
        <MoreHorizontal className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="border-app-border bg-app-panel text-app-text shadow-md shadow-app-border sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit pinned achievements</DialogTitle>
            <DialogDescription className="text-app-muted">
              Choose up to {MAX_PINNED_ACHIEVEMENTS} achievements. Changes stay local
              until you press Save.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-app-border bg-app-bg/60 p-3 text-sm text-app-muted">
            Selected {selectedKeys.length} of {MAX_PINNED_ACHIEVEMENTS}.
            <span className="block pt-1 text-xs">
              Existing pins can stay selected. New pins are saved when you press Save.
            </span>
          </div>

          <div className="max-h-[420px] overflow-y-auto pr-1 app-scrollbar">
            <div className="space-y-2">
              {sortedAchievements.map((achievement) => {
                const key = getAchievementKey(achievement);
                const isSelected = selectedKeySet.has(key);
                const isUnavailable =
                  !achievement.isPinned && !achievement.steamAchievementId;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleToggleAchievement(achievement)}
                    className={[
                      "flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors",
                      isSelected
                        ? "border-brand/60 bg-brand/15"
                        : "border-app-border bg-app-panel2/70 hover:bg-app-panel2",
                      isUnavailable ? "opacity-60" : "",
                    ].join(" ")}
                  >
                    <AchievementIcon achievement={achievement} />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-app-text">
                        {achievement.achievement.name}
                      </p>
                      <p className="truncate text-sm text-app-muted">
                        {achievement.game.name}
                      </p>
                      <p className="pt-1 text-xs text-app-muted">
                        {achievement.isPinned
                          ? "Currently pinned"
                          : isUnavailable
                            ? "Unavailable for pinning with the current profile data"
                            : "Available to pin"}
                      </p>
                    </div>

                    <div
                      className={[
                        "shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
                        isSelected
                          ? "border-brand/60 bg-brand text-white"
                          : "border-app-border text-app-muted",
                      ].join(" ")}
                    >
                      {isSelected ? "Selected" : "Select"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
