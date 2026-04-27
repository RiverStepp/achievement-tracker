import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export type LeaderboardEntry = {
  rank: number;
  publicId: string | null;
  steamProfileId: string;
  isClaimed: boolean;
  personaName: string | null;
  avatarUrl: string | null;
  profileUrl: string | null;
  totalAchievementsUnlocked: number;
  totalGamesTracked: number;
  perfectGamesCount: number;
  totalPoints: number;
  lastSyncedDate: string | null;
};

export type LeaderboardPage = {
  entries: LeaderboardEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
};

type LeaderboardPageDto = {
  entries: {
    rank: number;
    publicId: string | null;
    steamProfileId: number;
    isClaimed: boolean;
    personaName: string | null;
    avatarUrl: string | null;
    profileUrl: string | null;
    totalAchievementsUnlocked: number;
    totalGamesTracked: number;
    perfectGamesCount: number;
    totalPoints: number;
    lastSyncedDate: string | null;
  }[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export const leaderboardService = {
  getPage: async (page: number, pageSize = 25): Promise<LeaderboardPage> => {
    const response = await api.get<LeaderboardPageDto>(endpoints.leaderboard.get, {
      params: { page, pageSize },
    });

    const dto = response.data;
    return {
      entries: dto.entries.map((e) => ({
        rank: e.rank,
        publicId: e.publicId ?? null,
        steamProfileId: String(e.steamProfileId),
        isClaimed: e.isClaimed,
        personaName: e.personaName,
        avatarUrl: e.avatarUrl,
        profileUrl: e.profileUrl,
        totalAchievementsUnlocked: e.totalAchievementsUnlocked,
        totalGamesTracked: e.totalGamesTracked,
        perfectGamesCount: e.perfectGamesCount,
        totalPoints: e.totalPoints,
        lastSyncedDate: e.lastSyncedDate,
      })),
      totalCount: dto.totalCount,
      page: dto.page,
      pageSize: dto.pageSize,
    };
  },
} as const;
