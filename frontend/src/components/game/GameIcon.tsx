import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useExclusiveHoverCardGroup } from "@/components/ui/exclusive-hover-card-scope";
import type { ProfileGame } from "@/types/profile";
import { GameCard } from "./GameCard";
import { ACHIEVEMENT_HOVER_CARD_OPEN_DELAY_MS } from "@/constants/profileUi";

type GameIconProps = {
  game: ProfileGame;
};

const fallbackGameImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='14' fill='%23334155'/%3E%3Cpath d='M16 66l18-20 12 14 8-10 18 16H16z' fill='%2394a3b8'/%3E%3Ccircle cx='34' cy='30' r='7' fill='%2394a3b8'/%3E%3C/svg%3E";

export const GameIcon = ({ game }: GameIconProps) => {
  const imageUrl = game.game.iconUrl ?? game.game.headerImageUrl ?? fallbackGameImage;
  const hoverGroup = useExclusiveHoverCardGroup();
  const hoverKey = `${game.id}|${game.name}|${game.latestUnlockDate}`;
  const useExclusiveHover = hoverGroup !== null;

  const open = useExclusiveHover ? hoverGroup.activeKey === hoverKey : undefined;
  const onOpenChange =
    useExclusiveHover && hoverGroup
      ? (next: boolean) => {
          hoverGroup.setActiveKey(next ? hoverKey : null);
        }
      : undefined;

  return (
    <div className="w-fit rounded-md hover:outline hover:outline-2 hover:outline-cyan-100/75 hover:outline-offset-2">
      <HoverCard
        open={open}
        onOpenChange={onOpenChange}
        openDelay={ACHIEVEMENT_HOVER_CARD_OPEN_DELAY_MS}
        closeDelay={0}
      >
        <HoverCardTrigger asChild>
          <img
            src={imageUrl}
            alt={`${game.name} icon`}
            className="h-12 w-12 rounded-md border border-app-border object-cover shadow-md shadow-app-border"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = fallbackGameImage;
            }}
          />
        </HoverCardTrigger>
        <HoverCardContent className="w-[19rem] p-3">
          <GameCard game={game} />
        </HoverCardContent>
      </HoverCard>
    </div>
  );
};
