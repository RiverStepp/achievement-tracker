import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { GameDetails } from "@/types/game";
import { gameService } from "@/services/game";
import { GameHeader } from "@/components/game/GameHeader";
import { GameAchievementList } from "@/components/game/GameAchievementList";
 
export function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  useEffect(() => {
    const id = Number(gameId);
    if (!gameId || isNaN(id) || id <= 0) {
      setError("Invalid game ID.");
      setLoading(false);
      return;
    }
 
    setLoading(true);
    setError(null);
 
    gameService
      .getGameDetails(id)
      .then(setGame)
      .catch(() => setError("Game not found or failed to load."))
      .finally(() => setLoading(false));
  }, [gameId]);
 
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-app-muted text-sm">
        Loading…
      </div>
    );
  }
 
  if (error || !game) {
    return (
      <div className="flex items-center justify-center py-24 text-app-muted text-sm">
        {error ?? "Game not found."}
      </div>
    );
  }
 
  return (
    <div className="w-full max-w-[900px] mx-auto space-y-4 pb-8">
      <GameHeader game={game} />
      <GameAchievementList achievements={game.achievements} />
    </div>
  );
}
 
export default GamePage;
