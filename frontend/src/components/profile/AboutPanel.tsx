import type { UserProfile } from "@/types/profile";
import { Trophy } from "lucide-react";

type AboutProps = {
  profile: UserProfile;
};

export const AboutPanel = ({ profile }: AboutProps) => {
  const pinnedAchievements =
    profile.achievements?.filter((item) => item.isPinned) ?? [];

  return (
    <div className="h-full p-4 bg-app-panel rounded-lg shadow-md shadow-app-border">
      <h2 className="app-heading mb-2">Bio</h2>
      <p className="text-app-text text-sm mb-4">
        {profile.identity.bio || "Nothing here yet."}
      </p>
      <hr className="mb-2 border-app-border" />
      <h2 className="app-heading mb-2">Pinned Achievements</h2>
      {pinnedAchievements.length ? (
        <div className="space-y-2">
          {pinnedAchievements.map((item) => (
            <div key={item.id} className="flex items-start gap-2 text-sm">
              <Trophy className="h-4 w-4 mt-0.5 text-app-muted" aria-hidden="true" />
              <div>
                <p className="text-app-text leading-tight">{item.achievement.name}</p>
                <p className="text-app-muted text-xs leading-tight">{item.game.name}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-app-muted text-sm">No pinned achievements yet.</p>
      )}
    </div>
  );
};
