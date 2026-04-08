import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export type ResolveVanityUrlRequest = {
  vanityUrl?: string;
};

export type GetPlayerSummariesRequest = {
  steamIds?: string;
};

export type GetOwnedGamesRequest = {
  steamId?: string;
  includeAppInfo?: boolean;
  includePlayedFreeGames?: boolean;
};

export type GetPlayerAchievementsRequest = {
  steamId?: string;
  appId?: number;
  l?: string;
};

export type GetUserStatsForGameRequest = {
  steamId?: string;
  appId?: number;
};

export type GetSchemaForGameRequest = {
  appId?: number;
  l?: string;
};

export const steamProxyService = {
  resolveVanityUrl: async (request?: ResolveVanityUrlRequest): Promise<unknown> => {
    const response = await api.get(endpoints.steamWebApiProxy.resolveVanityUrl, {
      params: request,
    });
    return response.data;
  },

  getPlayerSummaries: async (
    request?: GetPlayerSummariesRequest
  ): Promise<unknown> => {
    const response = await api.get(
      endpoints.steamWebApiProxy.getPlayerSummaries,
      {
        params: request,
      }
    );
    return response.data;
  },

  getOwnedGames: async (request?: GetOwnedGamesRequest): Promise<unknown> => {
    const response = await api.get(endpoints.steamWebApiProxy.getOwnedGames, {
      params: request,
    });
    return response.data;
  },

  getPlayerAchievements: async (
    request?: GetPlayerAchievementsRequest
  ): Promise<unknown> => {
    const response = await api.get(
      endpoints.steamWebApiProxy.getPlayerAchievements,
      {
        params: request,
      }
    );
    return response.data;
  },

  getUserStatsForGame: async (
    request?: GetUserStatsForGameRequest
  ): Promise<unknown> => {
    const response = await api.get(
      endpoints.steamWebApiProxy.getUserStatsForGame,
      {
        params: request,
      }
    );
    return response.data;
  },

  getSchemaForGame: async (
    request?: GetSchemaForGameRequest
  ): Promise<unknown> => {
    const response = await api.get(
      endpoints.steamWebApiProxy.getSchemaForGame,
      {
        params: request,
      }
    );
    return response.data;
  },
} as const;
