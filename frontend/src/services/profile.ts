import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { UserProfile } from "@/types/profile";
import type { AppUser } from "@/types/models";
import type { SteamUser } from "@/types/auth";

export type GetUserProfileRequest = {
  gamesPageNumber?: number;
  gamesPageSize?: number;
  achievementsPageNumber?: number;
  achievementsPageSize?: number;
  achievementsByPointsPageNumber?: number;
  achievementsByPointsPageSize?: number;
  latestActivityPageNumber?: number;
  latestActivityPageSize?: number;
};

type PagedResultDto<T> = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  items: T[];
};

type ProfileAppUserDto = {
  handle: string | null;
  displayName: string | null;
};

type SteamProfileMetadataDto = {
  profileUrl: string | null;
  avatarSmallUrl: string | null;
  lastCheckedDate: string | null;
  lastSyncedDate: string | null;
  isPrivate: boolean;
};

type UserTotalsDto = {
  totalPoints: number;
  totalAchievements: number;
  totalPlaytimeMinutes: number;
  gamesAt100Percent: number;
  startedGamesCount: number;
  ownedGamesCount: number;
  avgCompletionPercent: number | null;
};

type ProfileAchievementItemDto = {
  gameId: number;
  gameName: string;
  achievementName: string;
  iconUrl: string | null;
  description: string | null;
  rarity: number | null;
  unlockDate: string;
  points: number;
};

type ProfilePinnedAchievementDto = {
  appUserPinnedAchievementId: number;
  displayOrder: number;
  platformId: number;
  steamAchievementId: number;
  gameId: number;
  gameName: string;
  achievementName: string;
  iconUrl: string | null;
  description: string | null;
  rarity: number | null;
  unlockDate: string;
  points: number;
};

type UserProfileResponse = {
  appUser: ProfileAppUserDto | null;
  steamProfile: SteamProfileMetadataDto | null;
  totals: UserTotalsDto;
  gamesByRecentAchievement: PagedResultDto<unknown>;
  recentAchievements: PagedResultDto<ProfileAchievementItemDto>;
  achievementsByPoints: PagedResultDto<ProfileAchievementItemDto>;
  pinnedAchievements: ProfilePinnedAchievementDto[];
  latestActivity: PagedResultDto<unknown>;
};

const DEFAULT_REQUEST: GetUserProfileRequest = {
  gamesPageNumber: 1,
  gamesPageSize: 250,
  achievementsPageNumber: 1,
  achievementsPageSize: 1000,
  achievementsByPointsPageNumber: 1,
  achievementsByPointsPageSize: 1000,
  latestActivityPageNumber: 1,
  latestActivityPageSize: 100,
};

function normalizeHandle(value?: string | null) {
  return value?.replace(/^@/, "").trim() || "";
}

function toAchievementKey(gameId: number, achievementName: string, unlockDate: string) {
  return `${gameId}|${achievementName}|${unlockDate}`;
}

function synthesizeId(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function mergePlatforms(base: UserProfile["connections"]["platforms"], extra: UserProfile["connections"]["platforms"]) {
  return Array.from(new Set([...base, ...extra]));
}

export function mapUserProfileResponse(
  response: UserProfileResponse,
  fallback?: UserProfile | null,
  options?: {
    publicId?: string;
    steamId?: string;
    isSelf?: boolean;
  }
): UserProfile {
  const normalizedHandle =
    normalizeHandle(response.appUser?.handle) || fallback?.handle || "unknown";
  const displayName =
    response.appUser?.displayName || fallback?.displayName || normalizedHandle;

  const pinnedKeys = new Set(
    response.pinnedAchievements.map((item) =>
      toAchievementKey(item.gameId, item.achievementName, item.unlockDate)
    )
  );

  const pinnedAchievements = response.pinnedAchievements.map((item) => ({
    id: item.appUserPinnedAchievementId,
    unlockedAt: item.unlockDate,
    isPinned: true,
    achievement: {
      id: item.steamAchievementId,
      gameId: item.gameId,
      steamApiname: item.achievementName,
      name: item.achievementName,
      description: item.description ?? undefined,
      iconUrl: item.iconUrl ?? undefined,
      points: item.points,
      globalPercentage: item.rarity ?? undefined,
    },
    game: {
      id: item.gameId,
      name: item.gameName,
      steamAppId: item.gameId,
      iconUrl: undefined,
      headerImageUrl: undefined,
    },
  }));

  const recentAchievements = response.recentAchievements.items.map((item) => ({
    id: synthesizeId(toAchievementKey(item.gameId, item.achievementName, item.unlockDate)),
    unlockedAt: item.unlockDate,
    isPinned: pinnedKeys.has(toAchievementKey(item.gameId, item.achievementName, item.unlockDate)),
    achievement: {
      id: synthesizeId(`achievement|${item.gameId}|${item.achievementName}`),
      gameId: item.gameId,
      steamApiname: item.achievementName,
      name: item.achievementName,
      description: item.description ?? undefined,
      iconUrl: item.iconUrl ?? undefined,
      points: item.points,
      globalPercentage: item.rarity ?? undefined,
    },
    game: {
      id: item.gameId,
      name: item.gameName,
      steamAppId: item.gameId,
      iconUrl: undefined,
      headerImageUrl: undefined,
    },
  }));

  const achievementMap = new Map<number, (typeof recentAchievements)[number]>();
  for (const item of pinnedAchievements) {
    achievementMap.set(item.id, item);
  }
  for (const item of recentAchievements) {
    const existing = Array.from(achievementMap.values()).find(
      (candidate) =>
        candidate.game.id === item.game.id &&
        candidate.achievement.name === item.achievement.name &&
        candidate.unlockedAt === item.unlockedAt
    );
    if (!existing) {
      achievementMap.set(item.id, item);
    }
  }

  const steamProfileUrl = response.steamProfile?.profileUrl || fallback?.steam?.profileUrl || null;
  const linkedAccounts: UserProfile["connections"]["linkedAccounts"] = steamProfileUrl
    ? [
        {
          platform: "steam",
          usernameOrId:
            fallback?.connections.linkedAccounts.find((item) => item.platform === "steam")?.usernameOrId ||
            displayName,
          profileUrl: steamProfileUrl,
          accountVerified: true,
        },
      ]
    : fallback?.connections.linkedAccounts ?? [];

  const mergedPlatforms = mergePlatforms(
    fallback?.connections.platforms ?? [],
    linkedAccounts.length > 0 ? ["steam"] : []
  );

  const totalHours = Math.round((response.totals.totalPlaytimeMinutes ?? 0) / 60);
  const fallbackSteam = fallback?.steam;
  const steam: SteamUser | null =
    fallbackSteam || options?.steamId || steamProfileUrl || response.steamProfile?.avatarSmallUrl
      ? {
          ...fallbackSteam,
          steamId: options?.steamId ?? fallbackSteam?.steamId ?? "",
          personaName: fallbackSteam?.personaName ?? displayName,
          profileUrl: steamProfileUrl,
          avatarSmallUrl: response.steamProfile?.avatarSmallUrl ?? fallbackSteam?.avatarSmallUrl ?? null,
          avatarMediumUrl: fallbackSteam?.avatarMediumUrl ?? response.steamProfile?.avatarSmallUrl ?? null,
          avatarFullUrl: fallbackSteam?.avatarFullUrl ?? response.steamProfile?.avatarSmallUrl ?? null,
        }
      : null;

  console.log("[profile] raw backend response", {
    publicId: options?.publicId,
    appUser: response.appUser,
    steamProfile: response.steamProfile,
    totals: response.totals,
    recentAchievementsCount: response.recentAchievements.items.length,
    recentAchievementsTotal: response.recentAchievements.totalCount,
    pinnedAchievementsCount: response.pinnedAchievements.length,
    latestActivityCount: response.latestActivity.items.length,
    fallbackHandle: fallback?.handle ?? null,
  });

  const mappedProfile: UserProfile = {
    user: {
      id: fallback?.user.id ?? 0,
      publicId: options?.publicId ?? fallback?.user.publicId,
      roles: fallback?.user.roles ?? ["User"],
      isListedOnLeaderboards: fallback?.user.isListedOnLeaderboards,
      lastLoginDate: fallback?.user.lastLoginDate,
    } as AppUser,
    steam,
    displayName,
    handle: normalizedHandle,
    avatarUrl: fallback?.avatarUrl ?? response.steamProfile?.avatarSmallUrl ?? null,
    bannerUrl: fallback?.bannerUrl ?? null,
    bio: fallback?.bio ?? null,
    location: fallback?.location ?? null,
    timezone: fallback?.timezone ?? null,
    pronouns: fallback?.pronouns ?? null,
    joinedAt:
      fallback?.joinedAt ??
      response.steamProfile?.lastSyncedDate ??
      response.steamProfile?.lastCheckedDate ??
      new Date().toISOString(),
    connections: {
      platforms: mergedPlatforms.length > 0 ? mergedPlatforms : ["steam"],
      linkedAccounts,
      socials: fallback?.connections.socials ?? [],
    },
    summary: {
      totalAchievements: response.totals.totalAchievements,
      gamesTracked: response.totals.ownedGamesCount,
      hoursPlayed: totalHours,
    },
    achievements: Array.from(achievementMap.values()).sort(
      (left, right) => new Date(right.unlockedAt).getTime() - new Date(left.unlockedAt).getTime()
    ),
    feed: fallback?.feed ?? { items: [], comments: [] },
    privacy:
      fallback?.privacy ?? {
        showStats: true,
        showRecentAchievements: true,
        showLinkedAccounts: true,
        showSocialLinks: true,
        showFeed: true,
      },
    viewer: {
      isSelf: options?.isSelf ?? fallback?.viewer.isSelf ?? false,
    },
  };

  console.log("[profile] mapped frontend profile", {
    publicId: mappedProfile.user.publicId,
    handle: mappedProfile.handle,
    displayName: mappedProfile.displayName,
    summary: mappedProfile.summary,
    achievementCount: mappedProfile.achievements?.length ?? 0,
    pinnedCount: mappedProfile.achievements?.filter((item) => item.isPinned).length ?? 0,
    linkedAccounts: mappedProfile.connections.linkedAccounts,
  });

  return mappedProfile;
}

export const profileService = {
  getProfile: async (
    publicId: string,
    request?: GetUserProfileRequest,
    fallback?: UserProfile | null,
    options?: {
      steamId?: string;
      isSelf?: boolean;
    }
  ): Promise<UserProfile> => {
    console.log("[profile] getProfile request", {
      publicId,
      params: { ...DEFAULT_REQUEST, ...request },
      fallbackHandle: fallback?.handle ?? null,
      isSelf: options?.isSelf ?? false,
      steamId: options?.steamId ?? null,
    });

    const response = await api.get<UserProfileResponse>(
      endpoints.userProfiles.getProfile(publicId),
      {
        params: { ...DEFAULT_REQUEST, ...request },
      }
    );

    return mapUserProfileResponse(response.data, fallback, {
      publicId,
      steamId: options?.steamId,
      isSelf: options?.isSelf,
    });
  },
} as const;
