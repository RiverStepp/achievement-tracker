import type { UserProfile } from "@/types/profile";
import { formatDate } from "@/lib/format";
type LatestActivitiesProps = {
  profile: UserProfile;
};

export const LatestActivities = ({ profile }: LatestActivitiesProps) => {
  const latestActivities = (profile.latestActivity ?? []).slice(0, 10);

  return (
    <div className="max-h-[460px] p-4 bg-app-panel rounded-lg shadow-md shadow-app-border">
      <h2 className="app-heading mb-2">Latest Activity</h2>
      {latestActivities.length ? (
        <div className="space-y-3 max-h-[390px] overflow-y-auto app-scrollbar pr-1">
          {latestActivities.map((item) => (
            <div key={item.id} className="text-sm border-b border-app-border pb-2">
              <p className="text-app-text leading-tight">{item.title}</p>
              <p className="text-app-muted text-xs leading-tight truncate">
                {item.detail}
              </p>
              <p className="text-app-muted text-xs leading-tight mt-1">
                {item.kind} - {formatDate(item.occurredAt)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-app-muted text-sm">No recent activity yet.</p>
      )}
    </div>
  );
};
