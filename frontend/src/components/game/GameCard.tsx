import { CalendarDays, FileQuestion, Trophy } from "lucide-react";

import { formatDate, formatHours } from "@/lib/format";
import type { ProfileGame } from "@/types/profile";

type GameCardProps = {
  game: ProfileGame;
};

const fallbackGameImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 64'%3E%3Crect width='120' height='64' rx='12' fill='%23334155'/%3E%3Cpath d='M18 44l20-21 14 16 10-11 22 16H18z' fill='%2394a3b8'/%3E%3Ccircle cx='36' cy='20' r='6' fill='%2394a3b8'/%3E%3C/svg%3E";

export const GameCard = ({ game }: GameCardProps) => {
  const imageUrl = game.game.headerImageUrl ?? game.game.iconUrl;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-2">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${game.name} art`}
            className="h-9 w-9 rounded-md object-cover"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = fallbackGameImage;
            }}
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-app-panel2">
            <FileQuestion className="h-4 w-4 text-app-muted" />
          </div>
        )}
        <span className="min-w-0 break-words text-xs text-app-muted">{game.name}</span>
      </div>

      <div className="space-y-1">
        <h3 className="app-heading break-words text-sm">{game.name}</h3>
        <div className="flex items-center gap-2 text-xs text-app-muted">
          <Trophy className="h-3.5 w-3.5" />
          <span>
            {game.earnedCount}/{game.totalAchievements} achievements
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-app-muted">
        <CalendarDays className="h-3.5 w-3.5" />
        <span>Latest unlock {formatDate(game.latestUnlockDate)}</span>
      </div>

      <p className="break-words text-xs text-app-muted">
        {game.percentCompletion?.toFixed(1) ?? "0.0"}% completion,{" "}
        {game.pointsEarned}/{game.pointsAvailable} points,{" "}
        {formatHours((game.playtimeForever ?? 0) / 60)} played.
      </p>
    </div>
  );
};
