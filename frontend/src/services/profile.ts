import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { ProfileAchievement, UserProfile } from "@/types/profile";
import {
  PROFILE_API_ACHIEVEMENTS_BY_POINTS_PAGE_SIZE,
  PROFILE_API_ACHIEVEMENTS_PAGE_SIZE,
  PROFILE_API_GAMES_PAGE_SIZE,
  PROFILE_API_LATEST_ACTIVITY_PAGE_SIZE,
} from "@/constants/profileUi";
import type { AppUser } from "@/types/models";
import type { SteamUser } from "@/types/auth";
import type { SocialKind } from "@/types/profile";

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
  bio: string | null;
  pronouns: string | null;
  location: {
    countryId: number | null;
    countryName: string | null;
    stateRegionId: number | null;
    stateName: string | null;
    cityId: number | null;
    cityName: string | null;
  } | null;
  timeZoneDisplayName: string | null;
  joinDate: string | null;
  profileImageUrl: string | null;
  bannerImageUrl: string | null;
};

type PublicIdByHandleResponse = {
  publicId: string;
};

type ProfileSocialLinkItemDto = {
  platform: number;
  linkValue: string;
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

type ProfileGameItemDto = {
  gameName: string;
  headerImageUrl: string | null;
  playtimeForever: number | null;
  earnedCount: number;
  totalAchievements: number;
  percentCompletion: number | null;
  isCompleted: boolean;
  pointsEarned: number;
  pointsAvailable: number;
  latestUnlockDate: string;
  durationMinutes: number | null;
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

type ProfileLatestActivityItemDto = {
  activityType: 1 | 2 | 3;
  activityAt: string;
  gameId?: number | null;
  gameName?: string | null;
  achievementName?: string | null;
  iconUrl?: string | null;
  description?: string | null;
  rarity?: number | null;
  points?: number | null;
  achievementId?: number | null;
  postPublicId?: string | null;
  postContent?: string | null;
  commentPublicId?: string | null;
  commentPostPublicId?: string | null;
  commentBody?: string | null;
};

type UserProfileResponse = {
  appUser: ProfileAppUserDto | null;
  visibleSocialLinks: ProfileSocialLinkItemDto[];
  steamProfile: SteamProfileMetadataDto | null;
  totals: UserTotalsDto;
  gamesByRecentAchievement: PagedResultDto<ProfileGameItemDto>;
  recentAchievements: PagedResultDto<ProfileAchievementItemDto>;
  achievementsByPoints: PagedResultDto<ProfileAchievementItemDto>;
  pinnedAchievements: ProfilePinnedAchievementDto[];
  latestActivity: PagedResultDto<ProfileLatestActivityItemDto>;
  isClaimed?: boolean;
};

const SOCIAL_KIND_BY_PLATFORM: Record<number, SocialKind> = {
  1: "youtube",
  2: "twitch",
  3: "discord",
};

const DEFAULT_REQUEST: GetUserProfileRequest = {
  gamesPageNumber: 1,
  gamesPageSize: PROFILE_API_GAMES_PAGE_SIZE,
  achievementsPageNumber: 1,
  achievementsPageSize: PROFILE_API_ACHIEVEMENTS_PAGE_SIZE,
  achievementsByPointsPageNumber: 1,
  achievementsByPointsPageSize: PROFILE_API_ACHIEVEMENTS_BY_POINTS_PAGE_SIZE,
  latestActivityPageNumber: 1,
  latestActivityPageSize: PROFILE_API_LATEST_ACTIVITY_PAGE_SIZE,
};

function avgCompletionFractionToDisplayPercent(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) {
    return null;
  }
  if (value >= 0 && value <= 1) {
    return value * 100;
  }
  return value;
}

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

function buildSteamHeaderImageUrl(steamAppId: number) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamAppId}/header.jpg`;
}

function buildProfileGame(gameId: number, gameName: string) {
  const headerImageUrl = buildSteamHeaderImageUrl(gameId);

  return {
    id: gameId,
    name: gameName,
    steamAppId: gameId,
    iconUrl: headerImageUrl,
    headerImageUrl,
  };
}

function synthesizeGameId(seed: string) {
  return synthesizeId(`game|${seed}`);
}

function normalizeGameName(value: string) {
  return value.trim().toLowerCase();
}

function mergePlatforms(base: UserProfile["connections"]["platforms"], extra: UserProfile["connections"]["platforms"]) {
  return Array.from(new Set([...base, ...extra]));
}

function buildLocationLabel(location: ProfileAppUserDto["location"] | undefined) {
  if (!location) {
    return null;
  }

  const parts = [location.cityName, location.stateName, location.countryName].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function buildActivityKey(item: ProfileLatestActivityItemDto) {
  return [
    item.activityType,
    item.activityAt,
    item.achievementId ?? "",
    item.postPublicId ?? "",
    item.commentPublicId ?? "",
  ].join("|");
}

function mapLatestActivityItem(item: ProfileLatestActivityItemDto) {
  switch (item.activityType) {
    case 1:
      return {
        id: `achievement-${buildActivityKey(item)}`,
        kind: "achievement" as const,
        occurredAt: item.activityAt,
        title: item.achievementName
          ? `Unlocked: ${item.achievementName}`
          : "Unlocked an achievement",
        detail: item.gameName ?? item.description ?? "Achievement activity",
        postPublicId: null,
        commentPublicId: null,
      };
    case 2:
      return {
        id: `post-${buildActivityKey(item)}`,
        kind: "post" as const,
        occurredAt: item.activityAt,
        title: "Posted an update",
        detail: item.postContent?.trim() || "Shared a new post",
        postPublicId: item.postPublicId ?? null,
        commentPublicId: null,
      };
    case 3:
      return {
        id: `comment-${buildActivityKey(item)}`,
        kind: "comment" as const,
        occurredAt: item.activityAt,
        title: "Left a comment",
        detail: item.commentBody?.trim() || "Replied in a discussion",
        postPublicId: item.commentPostPublicId ?? null,
        commentPublicId: item.commentPublicId ?? null,
      };
    default:
      return null;
  }
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
    steamAchievementId: item.steamAchievementId,
    pinnedAchievementId: item.appUserPinnedAchievementId,
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
    game: buildProfileGame(item.gameId, item.gameName),
  }));

  const mapProfileAchievementDtoItem = (
    item: ProfileAchievementItemDto
  ): ProfileAchievement => ({
    id: synthesizeId(toAchievementKey(item.gameId, item.achievementName, item.unlockDate)),
    steamAchievementId: undefined,
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
    game: buildProfileGame(item.gameId, item.gameName),
  });

  const achievementsFromLatestUnlock = response.recentAchievements.items.map(mapProfileAchievementDtoItem);
  const achievementsFromPointsOrdered = response.achievementsByPoints.items.map(mapProfileAchievementDtoItem);

  const achievementIdsByKey = new Map(
    response.latestActivity.items
      .filter((item) => item.activityType === 1 && item.achievementId)
      .map((item) => [
        toAchievementKey(
          item.gameId ?? 0,
          item.achievementName ?? "",
          item.activityAt
        ),
        item.achievementId as number,
      ])
  );

  const hydrateSteamAchievementIds = (collection: ProfileAchievement[]) => {
    for (const item of collection) {
      item.steamAchievementId =
        achievementIdsByKey.get(
          toAchievementKey(item.game.id, item.achievement.name, item.unlockedAt)
        ) ?? item.steamAchievementId;
    }
  };

  hydrateSteamAchievementIds(achievementsFromLatestUnlock);
  hydrateSteamAchievementIds(achievementsFromPointsOrdered);

  const profileGames = response.gamesByRecentAchievement.items.map((item) => {
    const gameId = synthesizeGameId(item.gameName);

    return {
      id: gameId,
      name: item.gameName,
      playtimeForever: item.playtimeForever,
      earnedCount: item.earnedCount,
      totalAchievements: item.totalAchievements,
      percentCompletion: item.percentCompletion,
      isCompleted: item.isCompleted,
      pointsEarned: item.pointsEarned,
      pointsAvailable: item.pointsAvailable,
      latestUnlockDate: item.latestUnlockDate,
      durationMinutes: item.durationMinutes,
      game: {
        id: gameId,
        name: item.gameName,
        steamAppId: gameId,
        iconUrl: item.headerImageUrl ?? undefined,
        headerImageUrl: item.headerImageUrl ?? undefined,
      },
    };
  });

  const profileGameByName = new Map(
    profileGames.map((item) => [normalizeGameName(item.name), item])
  );

  const hydrateAchievementGame = <T extends Pick<ProfileAchievement, "game">>(
    item: T
  ) => {
    const matchedGame = profileGameByName.get(normalizeGameName(item.game.name));
    if (!matchedGame) {
      return item;
    }

    return {
      ...item,
      game: {
        ...item.game,
        iconUrl: matchedGame.game.iconUrl ?? item.game.iconUrl,
        headerImageUrl: matchedGame.game.headerImageUrl ?? item.game.headerImageUrl,
      },
    };
  };

  const hydratedPinnedAchievements = pinnedAchievements.map(hydrateAchievementGame);
  const hydratedAchievementsLatest = achievementsFromLatestUnlock.map(hydrateAchievementGame);
  const hydratedAchievementsByPointsOrdered = achievementsFromPointsOrdered.map(hydrateAchievementGame);

  function mergeAchievementCollection(map: Map<number, ProfileAchievement>, items: ProfileAchievement[]) {
    for (const item of items) {
      const existing = Array.from(map.values()).find(
        (candidate) =>
          candidate.game.id === item.game.id &&
          candidate.achievement.name === item.achievement.name &&
          candidate.unlockedAt === item.unlockedAt
      );
      if (!existing) {
        map.set(item.id, item);
      }
    }
  }

  const achievementMap = new Map<number, ProfileAchievement>();
  mergeAchievementCollection(achievementMap, hydratedPinnedAchievements);
  mergeAchievementCollection(achievementMap, hydratedAchievementsLatest);
  mergeAchievementCollection(achievementMap, hydratedAchievementsByPointsOrdered);

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
    visibleSocialLinks: response.visibleSocialLinks,
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
    avatarUrl:
      response.appUser?.profileImageUrl ??
      fallback?.avatarUrl ??
      response.steamProfile?.avatarSmallUrl ??
      null,
    bannerUrl: response.appUser?.bannerImageUrl ?? fallback?.bannerUrl ?? null,
    bio: response.appUser?.bio ?? fallback?.bio ?? null,
    location: buildLocationLabel(response.appUser?.location) ?? fallback?.location ?? null,
    timezone: response.appUser?.timeZoneDisplayName ?? fallback?.timezone ?? null,
    pronouns: response.appUser?.pronouns ?? fallback?.pronouns ?? null,
    joinedAt:
      response.appUser?.joinDate ??
      fallback?.joinedAt ??
      response.steamProfile?.lastSyncedDate ??
      response.steamProfile?.lastCheckedDate ??
      new Date().toISOString(),
    connections: {
      platforms: mergedPlatforms.length > 0 ? mergedPlatforms : ["steam"],
      linkedAccounts,
      socials:
        response.visibleSocialLinks.length > 0
          ? response.visibleSocialLinks
              .map((item) => {
                const kind = SOCIAL_KIND_BY_PLATFORM[item.platform];
                return kind ? { kind, url: item.linkValue } : null;
              })
              .filter((item): item is NonNullable<typeof item> => item !== null)
          : fallback?.connections.socials ?? [],
    },
    summary: {
      totalAchievements: response.totals.totalAchievements,
      gamesTracked: response.totals.ownedGamesCount,
      hoursPlayed: totalHours,
      totalPoints: response.totals.totalPoints,
      gamesAt100Percent: response.totals.gamesAt100Percent,
      startedGamesCount: response.totals.startedGamesCount,
      avgCompletionPercent: avgCompletionFractionToDisplayPercent(response.totals.avgCompletionPercent),
    },
    games: profileGames,
    achievements: Array.from(achievementMap.values()).sort(
      (left, right) => new Date(right.unlockedAt).getTime() - new Date(left.unlockedAt).getTime()
    ),
    achievementsByLatestUnlock: hydratedAchievementsLatest,
    achievementsByPointsOrder: hydratedAchievementsByPointsOrdered,
    steamSync: response.steamProfile
      ? {
          lastCheckedDate: response.steamProfile.lastCheckedDate,
          lastSyncedDate: response.steamProfile.lastSyncedDate,
          isPrivate: response.steamProfile.isPrivate,
        }
      : null,
    isClaimed: typeof response.isClaimed === "boolean" ? response.isClaimed : null,
    latestActivity: response.latestActivity.items
      .map(mapLatestActivityItem)
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort(
        (left, right) =>
          new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
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
  resolvePublicIdByHandle: async (handle: string): Promise<string | null> => {
    console.log("[profile] resolvePublicIdByHandle request", { handle });

    try {
      const response = await api.get<PublicIdByHandleResponse>(
        endpoints.userProfiles.getPublicIdByHandle(handle)
      );

      console.log("[profile] resolvePublicIdByHandle response", {
        handle,
        publicId: response.data.publicId,
      });

      return response.data.publicId;
    } catch (error) {
      console.log("[profile] resolvePublicIdByHandle failed", { handle, error });
      return null;
    }
  },

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

  pinAchievement: async (steamAchievementId: number): Promise<void> => {
    console.log("[profile] pinAchievement request", { steamAchievementId });

    await api.post(endpoints.me.pinAchievement, {
      steamAchievementId,
      platformId: 1,
    });

    console.log("[profile] pinAchievement success", { steamAchievementId });
  },

  unpinAchievement: async (pinnedAchievementId: number): Promise<void> => {
    console.log("[profile] unpinAchievement request", { pinnedAchievementId });

    await api.delete(endpoints.me.unpinAchievement(pinnedAchievementId));

    console.log("[profile] unpinAchievement success", { pinnedAchievementId });
  },
} as const;
