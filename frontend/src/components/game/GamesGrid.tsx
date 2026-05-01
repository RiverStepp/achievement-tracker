import { useEffect, useState } from "react";

import { ExclusiveHoverCardScope } from "@/components/ui/exclusive-hover-card-scope";
import { GameIcon } from "@/components/game/GameIcon";
import type { ProfileGame } from "@/types/profile";

type GamesGridProps = {
  games: ProfileGame[];
  filter: "recent" | "a-z" | "z-a" | "completion" | "playtime";
};

export const GamesGrid = ({ games, filter }: GamesGridProps) => {
  const [sortedGames, setSortedGames] = useState<ProfileGame[]>([]);

  useEffect(() => {
    const nextGames = [...games];

    const compareNames = (a: string, b: string) =>
      a.localeCompare(b, undefined, { sensitivity: "base" });

    nextGames.sort((left, right) => {
      switch (filter) {
        case "recent":
          return (
            new Date(right.latestUnlockDate).getTime() -
            new Date(left.latestUnlockDate).getTime()
          );
        case "a-z":
          return compareNames(left.name, right.name);
        case "z-a":
          return compareNames(right.name, left.name);
        case "completion":
          return (right.percentCompletion ?? 0) - (left.percentCompletion ?? 0);
        case "playtime":
          return (right.playtimeForever ?? 0) - (left.playtimeForever ?? 0);
        default:
          return 0;
      }
    });

    setSortedGames(nextGames);
  }, [filter, games]);

  return (
    <ExclusiveHoverCardScope>
      <div className="inline-flex w-fit min-h-fit flex-row flex-wrap">
        {sortedGames.map((game) => (
          <div key={`${game.id}-${game.latestUnlockDate}`} className="m-1 text-sm">
            <GameIcon game={game} />
          </div>
        ))}
      </div>
    </ExclusiveHoverCardScope>
  );
};
