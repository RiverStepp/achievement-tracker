import type { GameDetails } from "@/types/game";
 
type GameHeaderProps = {
  game: GameDetails;
};
 
export function GameHeader({ game }: GameHeaderProps) {
  const releaseYear = game.releaseDate
    ? new Date(game.releaseDate).getFullYear()
    : null;
 
  const progress = game.authenticatedProgress;
 
  return (
    <div className="rounded-xl overflow-hidden bg-app-panel shadow-md shadow-app-border">
      {game.headerImageUrl && (
        <div className="relative h-40 w-full overflow-hidden">
          <img
            src={game.headerImageUrl}
            alt={game.gameName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-app-panel via-app-panel/40 to-transparent" />
        </div>
      )}
 
      <div className="px-5 pb-5 pt-3 space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="app-heading text-2xl">{game.gameName}</h1>
              {game.isRemoved && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/50 text-red-300 border border-red-700/50">
                  Removed
                </span>
              )}
              {game.isUnlisted && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/50 text-yellow-300 border border-yellow-700/50">
                  Unlisted
                </span>
              )}
            </div>
            {releaseYear && (
              <p className="text-app-muted text-sm">{releaseYear}</p>
            )}
          </div>
 
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-brand">
              {game.totalAvailablePoints.toLocaleString()}
            </p>
            <p className="text-app-muted text-xs">total points</p>
          </div>
        </div>
 
        {game.shortDescription && (
          <p className="text-app-muted text-sm leading-relaxed">
            {game.shortDescription}
          </p>
        )}
 
        {progress && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-app-muted">
              <span>
                {progress.unlockedAchievementCount} /{" "}
                {progress.unlockedAchievementCount + progress.lockedAchievementCount} achievements
              </span>
              <span>
                {progress.pointsEarned.toLocaleString()} / {game.totalAvailablePoints.toLocaleString()} pts
                {progress.achievementCompletionPercent != null && (
                  <> &mdash; {progress.achievementCompletionPercent.toFixed(1)}%</>
                )}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-app-bg overflow-hidden">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{
                  width: `${Math.min(100, progress.achievementCompletionPercent ?? 0)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
