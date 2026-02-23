import type { UserProfile } from "@/types/profile";
import { Trophy } from "lucide-react";
import { AchievementIcon } from "@/components/achievments/AchievementIcon";

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
        {profile.bio || "Nothing here yet."}
      </p>
      <hr className="mb-2 border-app-border" />
      <h2 className="app-heading mb-2">Pinned Achievements</h2>
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
  );
};
