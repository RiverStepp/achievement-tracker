import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { GameDetails } from "@/types/game";
 
export const gameService = {
  getGameDetails: async (gameId: number): Promise<GameDetails> => {
    const response = await api.get<GameDetails>(endpoints.steamGames.getDetails(gameId));
    return response.data;
  },
} as const;
