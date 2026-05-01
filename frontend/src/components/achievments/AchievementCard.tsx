import { ProfileAchievement } from "@/types/profile";
import { CalendarDays, FileQuestion } from "lucide-react";
import { formatDate } from "@/lib/format";

type AchievementCardProps = {
  achievement: ProfileAchievement;
};

const fallbackGameImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 54'%3E%3Crect width='96' height='54' rx='10' fill='%23334155'/%3E%3Cpath d='M18 38l14-15 10 12 8-9 16 12H18z' fill='%2394a3b8'/%3E%3Ccircle cx='30' cy='18' r='5' fill='%2394a3b8'/%3E%3C/svg%3E";

function buildSteamHeaderImageUrl(steamAppId?: number) {
  return steamAppId
    ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamAppId}/header.jpg`
    : undefined;
}

export const AchievementCard = ({ achievement }: AchievementCardProps) => {
  const gameImageUrl =
    achievement.game.iconUrl ??
    achievement.game.headerImageUrl ??
    buildSteamHeaderImageUrl(achievement.game.steamAppId);

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-2">
        {gameImageUrl ? (
          <img
            src={gameImageUrl}
            alt={`${achievement.game.name} art`}
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
        <span className="min-w-0 break-words text-xs text-app-muted">
          {achievement.game.name}
        </span>
      </div>

      <div className="space-y-1">
        <h3 className="app-heading break-words text-sm">
          {achievement.achievement.name}
        </h3>
        {typeof achievement.achievement.points === "number" ? (
          <p className="text-xs font-semibold text-app-text">
            {achievement.achievement.points === 1
              ? "1 point"
              : `${achievement.achievement.points} points`}
          </p>
        ) : null}
        <p className="break-words text-app-muted text-xs leading-relaxed">
          {achievement.achievement.description ?? "No description available."}
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-app-muted">
        <CalendarDays className="h-3.5 w-3.5" />
        <span>Unlocked {formatDate(achievement.unlockedAt)}</span>
      </div>

      <p className="break-words text-app-muted text-xs">
        {achievement.achievement.globalPercentage != null
          ? `${achievement.achievement.globalPercentage.toFixed(1)}% of players have unlocked this.`
          : "Rarity data is not available for this achievement."}
      </p>
    </div>
  );
};
