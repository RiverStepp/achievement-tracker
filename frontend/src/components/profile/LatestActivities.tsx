import { useEffect, useState } from "react";
import type { UserProfile } from "@/types/profile";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  PROFILE_LATEST_ACTIVITY_INITIAL_VISIBLE_COUNT,
  PROFILE_LATEST_ACTIVITY_SHOW_MORE_BATCH_SIZE,
} from "@/constants/profileUi";

type LatestActivitiesProps = {
  profile: UserProfile;
};

export const LatestActivities = ({ profile }: LatestActivitiesProps) => {
  const latestActivities = profile.latestActivity ?? [];

  const [visibleCount, setVisibleCount] = useState(
    PROFILE_LATEST_ACTIVITY_INITIAL_VISIBLE_COUNT
  );

  const profileIdentityKey = `${profile.user.publicId ?? ""}:${profile.handle}`;

  useEffect(() => {
    setVisibleCount(PROFILE_LATEST_ACTIVITY_INITIAL_VISIBLE_COUNT);
  }, [profileIdentityKey]);

  const visibleItems = latestActivities.slice(0, visibleCount);
  const hasMore = latestActivities.length > visibleCount;

  return (
    <div className="p-4 bg-app-panel rounded-lg shadow-md shadow-app-border">
      <h2 className="app-heading mb-2">Latest Activity</h2>
      {latestActivities.length ? (
        <div className="space-y-3 pr-1">
          {visibleItems.map((item) => (
            <div key={item.id} className="text-sm border-b border-app-border pb-2">
              <p className="text-app-text leading-tight">{item.title}</p>
              <p className="text-app-muted text-xs leading-tight truncate">{item.detail}</p>
              <p className="text-app-muted text-xs leading-tight mt-1">
                {item.kind} - {formatDate(item.occurredAt)}
              </p>
            </div>
          ))}
          {hasMore ? (
            <div className="flex justify-center pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setVisibleCount(
                    (current) => current + PROFILE_LATEST_ACTIVITY_SHOW_MORE_BATCH_SIZE
                  )
                }
              >
                Show more
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-app-muted text-sm">No recent activity yet.</p>
      )}
    </div>
  );
};
