import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AchievementsGrid } from "./AchievementsGrid";
import { AchievementIcon } from "./AchievementIcon";
import { AchievementHoverScope } from "./AchievementHoverScope";
import { PinnedAchievementsDialog } from "./PinnedAchievementsDialog";
import type {
  ProfileAchievement,
  ProfileAchievementSortMode,
  UserProfile,
} from "@/types/profile";
import {
  PROFILE_ACHIEVEMENT_GRID_INITIAL_VISIBLE_COUNT,
  PROFILE_ACHIEVEMENT_GRID_SHOW_MORE_BATCH_SIZE,
} from "@/constants/profileUi";

type AchievementPanelProps = {
  profile: UserProfile;
  achievementSortMode: ProfileAchievementSortMode;
  onAchievementSortModeChange: (mode: ProfileAchievementSortMode) => void;
  isMe?: boolean;
  onPinnedAchievementsSaved?: () => void;
};

export const AchievementPanel = ({
  profile,
  achievementSortMode,
  onAchievementSortModeChange,
  isMe = false,
  onPinnedAchievementsSaved,
}: AchievementPanelProps) => {
  const [visibleAchievementCount, setVisibleAchievementCount] = useState(
    PROFILE_ACHIEVEMENT_GRID_INITIAL_VISIBLE_COUNT
  );

  const pinnedAchievements = profile.achievements?.filter((item) => item.isPinned) ?? [];

  const sortSource = useMemo(() => {
    if (achievementSortMode === "points") {
      return profile.achievementsByPointsOrder ?? profile.achievements ?? [];
    }
    return profile.achievementsByLatestUnlock ?? profile.achievements ?? [];
  }, [achievementSortMode, profile.achievements, profile.achievementsByLatestUnlock, profile.achievementsByPointsOrder]);

  const profileIdentityKey = `${profile.user.publicId ?? ""}:${profile.handle}`;

  useEffect(() => {
    setVisibleAchievementCount(PROFILE_ACHIEVEMENT_GRID_INITIAL_VISIBLE_COUNT);
  }, [achievementSortMode, profileIdentityKey]);

  const visibleAchievements: ProfileAchievement[] = sortSource.slice(0, visibleAchievementCount);
  const hasMoreAchievements = sortSource.length > visibleAchievementCount;

  return (
    <AchievementHoverScope>
      <>
        <div className="h-full p-4 bg-app-panel rounded-lg shadow-md shadow-app-border mb-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <h2 className="app-heading">Pinned Achievements</h2>
            </div>

            {isMe ? (
              <PinnedAchievementsDialog
                achievements={profile.achievements ?? []}
                onSaved={onPinnedAchievementsSaved}
              />
            ) : null}
          </div>
          {pinnedAchievements.length ? (
            <div className="flex flex-row flex-wrap max-h-48 min-h-fit">
              {pinnedAchievements.map((item) => (
                <div key={item.id} className="text-sm m-1">
                  <AchievementIcon achievement={item} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-app-muted text-sm">No pinned achievements yet.</p>
          )}
        </div>
        <div className="bg-app-panel overflow-hidden p-4 rounded-lg shadow-md shadow-app-border">
          <div className="flex items-center mb-4">
            <Label htmlFor="filter" className="text-app-label mr-2">
              Filter by:
            </Label>
            <select
              id="filter"
              value={achievementSortMode}
              onChange={(event) =>
                onAchievementSortModeChange(event.target.value as ProfileAchievementSortMode)
              }
              className="bg-app-bg text-app-text placeholder:text-app-placeholder border border-app-border rounded-md focus:outline-none focus:ring-2 focus:ring-app-focus"
            >
              <option value="latest">Latest</option>
              <option value="points">Points</option>
            </select>
          </div>
          <div className="flex flex-col items-center gap-3 pr-1">
            <AchievementsGrid achievements={visibleAchievements} />
            {hasMoreAchievements ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setVisibleAchievementCount(
                    (current) => current + PROFILE_ACHIEVEMENT_GRID_SHOW_MORE_BATCH_SIZE
                  )
                }
              >
                Show more
              </Button>
            ) : null}
          </div>
        </div>
      </>
    </AchievementHoverScope>
  );
};
