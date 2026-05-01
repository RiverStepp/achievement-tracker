import type { ProfileAchievement } from "@/types/profile";
import { AchievementIcon } from "@/components/achievments/AchievementIcon";

type AchievementsGridProps = {
  achievements: ProfileAchievement[];
};

export const AchievementsGrid = ({ achievements }: AchievementsGridProps) => {
  return (
    <div className="inline-flex flex-row flex-wrap min-h-fit w-fit">
      {achievements.map((item, index) => (
        <div
          key={`${item.id}-${item.achievement.id}-${item.unlockedAt}-${index}`}
          className="text-sm m-1"
        >
          <AchievementIcon achievement={item} />
        </div>
      ))}
    </div>
  );
};
