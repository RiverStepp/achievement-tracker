import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { AppUser } from "@/types/models";
import type { UserProfile, SocialKind } from "@/types/profile";
import type { SteamUser } from "@/types/auth";
import type {
  LocationCityOption,
  LocationStateRegionOption,
  MapSettingsToProfileContext,
  SettingsSocialPlatform,
  UpdateUserSettingsRequest,
  UserSettingsResponse,
} from "@/types/settings";

const SETTINGS_SOCIAL_KIND_BY_PLATFORM: Record<SettingsSocialPlatform, SocialKind> = {
  1: "youtube",
  2: "twitch",
  3: "discord",
};

function normalizeHandle(value?: string | null) {
  return value?.replace(/^@/, "").trim() || "";
}

function buildLocationLabel(settings: UserSettingsResponse) {
  const location = settings.location;
  if (!location) {
    return null;
  }

  const parts = [location.cityName, location.stateName, location.countryName].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function buildLinkedSteamAccount(
  steamUser: SteamUser | null,
  displayName: string
): UserProfile["connections"]["linkedAccounts"] {
  if (!steamUser?.profileUrl) {
    return [];
  }

  return [
    {
      platform: "steam",
      usernameOrId: steamUser.personaName || displayName || steamUser.steamId,
      profileUrl: steamUser.profileUrl,
      accountVerified: true,
    },
  ];
}

function buildProfileUser(appUser: AppUser | null, fallback?: UserProfile | null): AppUser {
  return {
    id: appUser?.id ?? fallback?.user.id ?? 0,
    publicId: appUser?.publicId ?? fallback?.user.publicId,
    roles: appUser?.roles ?? fallback?.user.roles ?? ["User"],
    isListedOnLeaderboards:
      appUser?.isListedOnLeaderboards ?? fallback?.user.isListedOnLeaderboards,
    lastLoginDate: appUser?.lastLoginDate ?? fallback?.user.lastLoginDate,
  };
}

export function mapUserSettingsToUserProfile(
  settings: UserSettingsResponse,
  context: MapSettingsToProfileContext
): UserProfile {
  const fallback = context.fallback ?? null;
  const displayName =
    settings.displayName ||
    fallback?.displayName ||
    context.steamUser?.personaName ||
    normalizeHandle(settings.handle) ||
    "Unknown";
  const steam = context.steamUser
    ? {
        ...fallback?.steam,
        ...context.steamUser,
        personaName: context.steamUser.personaName ?? fallback?.steam?.personaName ?? displayName,
      }
    : fallback?.steam ?? null;

  return {
    user: buildProfileUser(context.appUser, fallback),
    steam,
    displayName,
    handle: normalizeHandle(settings.handle) || fallback?.handle || "unknown",
    avatarUrl:
      settings.profileImage.url ||
      fallback?.avatarUrl ||
      steam?.avatarFullUrl ||
      steam?.avatarMediumUrl ||
      steam?.avatarSmallUrl ||
      null,
    bannerUrl: settings.bannerImage.url || fallback?.bannerUrl || null,
    bio: settings.bio ?? fallback?.bio ?? null,
    location: buildLocationLabel(settings) ?? fallback?.location ?? null,
    timezone:
      settings.timeZone?.displayName ||
      settings.timeZone?.ianaIdentifier ||
      fallback?.timezone ||
      null,
    pronouns: settings.pronouns?.displayLabel ?? fallback?.pronouns ?? null,
    joinedAt: fallback?.joinedAt ?? new Date().toISOString(),
    connections: {
      platforms:
        steam?.profileUrl || fallback?.connections.platforms.includes("steam")
          ? ["steam"]
          : fallback?.connections.platforms ?? [],
      linkedAccounts: buildLinkedSteamAccount(steam, displayName),
      socials: settings.socialLinks
        .filter((link) => link.isVisible && Boolean(link.linkValue))
        .map((link) => ({
          kind: SETTINGS_SOCIAL_KIND_BY_PLATFORM[link.platform],
          url: link.linkValue,
        })),
    },
    summary: fallback?.summary ?? {
      totalAchievements: 0,
      gamesTracked: 0,
      hoursPlayed: 0,
      totalPoints: 0,
      gamesAt100Percent: 0,
      startedGamesCount: 0,
      avgCompletionPercent: null,
    },
    achievements: fallback?.achievements ?? [],
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
      isSelf: true,
    },
  };
}

export const userSettingsService = {
  get: async (): Promise<UserSettingsResponse> => {
    const response = await api.get<UserSettingsResponse>(endpoints.me.settings);
    return response.data;
  },

  update: async (request: UpdateUserSettingsRequest): Promise<void> => {
    await api.put(endpoints.me.settings, request);
  },

  updateMedia: async (files: {
    profileImage?: File | null;
    bannerImage?: File | null;
  }): Promise<void> => {
    const formData = new FormData();
    if (files.profileImage) {
      formData.append("profileImage", files.profileImage);
    }
    if (files.bannerImage) {
      formData.append("bannerImage", files.bannerImage);
    }

    await api.put(endpoints.me.settingsMedia, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getStateRegions: async (countryId: number): Promise<LocationStateRegionOption[]> => {
    const response = await api.get<LocationStateRegionOption[]>(
      endpoints.settingsLookup.stateRegions(countryId)
    );
    return response.data;
  },

  getCities: async (stateRegionId: number): Promise<LocationCityOption[]> => {
    const response = await api.get<LocationCityOption[]>(
      endpoints.settingsLookup.cities(stateRegionId)
    );
    return response.data;
  },
} as const;
