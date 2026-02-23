import { Achievement } from "@/types/models";
import { ProfileAchievement } from "@/types/profile";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

type AchievementIconProps = {
  achievement: ProfileAchievement
};

export const AchievementIcon = ({ achievement }: AchievementIconProps) => {
  return (
    <div className="hover:outline-cyan-100/75 hover:outline hover:outline-2 hover:outline-offset-2 rounded">
      <HoverCard openDelay={10} closeDelay={80}>
        <HoverCardTrigger>
          <img src={achievement.achievement.iconUrl} alt={`${achievement.achievement.name} Icon`} className="h-12 w-12" />
        </HoverCardTrigger>
        <HoverCardContent>
          <h3 className="app-heading text-sm">{achievement.achievement.name}</h3>
          <p className="text-app-muted text-xs">{achievement.achievement.description}</p>

        </HoverCardContent>
      </HoverCard>
    </div>
  );
}