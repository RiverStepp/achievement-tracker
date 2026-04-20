import { ProfileAchievement } from "@/types/profile";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { AchievementCard } from "@/components/achievments/AchievementCard";

type AchievementIconProps = {
  achievement: ProfileAchievement
};

const fallbackAchievementIcon =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%23334155'/%3E%3Cpath d='M14 34l8-9 6 7 4-5 6 7H14z' fill='%2394a3b8'/%3E%3Ccircle cx='18' cy='16' r='4' fill='%2394a3b8'/%3E%3C/svg%3E";

export const AchievementIcon = ({ achievement }: AchievementIconProps) => {
  return (
    <div className="w-fit rounded-md hover:outline hover:outline-2 hover:outline-cyan-100/75 hover:outline-offset-2">
      <HoverCard openDelay={10} closeDelay={80}>
        <HoverCardTrigger asChild>
          <img
            src={achievement.achievement.iconUrl}
            alt={`${achievement.achievement.name} Icon`}
            className="h-12 w-12 object-cover rounded-md border border-app-border shadow-md shadow-app-border"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = fallbackAchievementIcon;
            }}
          />
        </HoverCardTrigger>
        <HoverCardContent>
          <AchievementCard achievement={achievement} />
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
