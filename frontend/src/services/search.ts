import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { AchievementSearchResult, PagedResult } from "@/types/search";

export type SearchAchievementsRequest = {
  query: string;
  pageNumber: number;
  pageSize?: number;
};

export const searchService = {
  searchAchievements: async (
    request: SearchAchievementsRequest
  ): Promise<PagedResult<AchievementSearchResult>> => {
    const response = await api.get<PagedResult<AchievementSearchResult>>(
      endpoints.steamAchievements.search,
      {
        params: {
          query: request.query,
          pageNumber: request.pageNumber,
          pageSize: request.pageSize,
        },
      }
    );

    return response.data;
  },
} as const;
