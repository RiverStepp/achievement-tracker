import { Link } from "react-router-dom";
import type { ProfileAchievement } from "@/types/profile";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { AchievementCard } from "@/components/achievments/AchievementCard";
import { useExclusiveHoverCardGroup } from "@/components/ui/exclusive-hover-card-scope";
import { ACHIEVEMENT_HOVER_CARD_OPEN_DELAY_MS } from "@/constants/profileUi";
import { cn } from "@/lib/utils";

type AchievementIconProps = {
  achievement: ProfileAchievement;
  navigable?: boolean;
};

const fallbackAchievementIcon =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%23334155'/%3E%3Cpath d='M14 34l8-9 6 7 4-5 6 7H14z' fill='%2394a3b8'/%3E%3Ccircle cx='18' cy='16' r='4' fill='%2394a3b8'/%3E%3C/svg%3E";

function gamePagePath(achievement: ProfileAchievement) {
  const id = achievement.game.steamAppId ?? achievement.game.id;
  return `/games/${id}`;
}

export const AchievementIcon = ({ achievement, navigable = true }: AchievementIconProps) => {
  const hoverGroup = useExclusiveHoverCardGroup();
  const hoverKey = String(achievement.id);
  const gameHref = gamePagePath(achievement);
  const useExclusiveHover = hoverGroup !== null;

  const open = useExclusiveHover ? hoverGroup.activeKey === hoverKey : undefined;
  const onOpenChange =
    useExclusiveHover && hoverGroup
      ? (next: boolean) => {
          hoverGroup.setActiveKey(next ? hoverKey : null);
        }
      : undefined;

  const imgClassName = cn(
    "h-12 w-12 object-cover rounded-md border border-app-border shadow-md shadow-app-border",
    navigable ? "cursor-pointer" : "cursor-default"
  );

  const img = (
    <img
      src={achievement.achievement.iconUrl || fallbackAchievementIcon}
      alt={`${achievement.achievement.name} Icon`}
      className={imgClassName}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = fallbackAchievementIcon;
      }}
    />
  );

  const trigger = navigable ? (
    <Link
      to={gameHref}
      className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg"
    >
      {img}
    </Link>
  ) : (
    <span className="block rounded-md">{img}</span>
  );

  const card = navigable ? (
    <Link to={gameHref} className="block cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg">
      <AchievementCard achievement={achievement} />
    </Link>
  ) : (
    <AchievementCard achievement={achievement} />
  );

  return (
    <div
      className={cn(
        "w-fit rounded-md",
        navigable && "hover:outline hover:outline-2 hover:outline-cyan-100/75 hover:outline-offset-2"
      )}
    >
      <HoverCard
        open={open}
        onOpenChange={onOpenChange}
        openDelay={ACHIEVEMENT_HOVER_CARD_OPEN_DELAY_MS}
        closeDelay={0}
      >
        <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
        <HoverCardContent className="w-[19rem] p-3">{card}</HoverCardContent>
      </HoverCard>
    </div>
  );
};
