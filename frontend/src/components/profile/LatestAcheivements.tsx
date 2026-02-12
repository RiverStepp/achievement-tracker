import type { UserProfile } from "@/types/profile";
import { formatDate } from "@/lib/format";

type LatestAcheivementsProps = {
  profile: UserProfile;
};

export const LatestAcheivements = ({ profile }: LatestAcheivementsProps) => {
  const latestAchievements = [...(profile.achievements ?? [])]
    .sort(
      (a, b) =>
        new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime(),
    )
    .slice(0, 8);

  return (
    <div className="h-full p-4 bg-app-panel h-auto rounded-lg shadow-md shadow-app-border">
      <h2 className="app-heading mb-2">Latest Achievements</h2>
      {latestAchievements.length ? (
        <div className="space-y-2">
          {latestAchievements.map((item) => (
            <div key={item.id} className="text-sm">
              <p className="text-app-text leading-tight">{item.achievement.name}</p>
              <p className="text-app-muted text-xs leading-tight">
                {item.game.name} - {formatDate(item.unlockedAt)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-app-muted text-sm">No recent achievements yet.</p>
      )}
    </div>
  );
};
