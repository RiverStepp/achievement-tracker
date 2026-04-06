import type { AppUser } from "@/types/models";
import type { UserProfile } from "@/types/profile";
import type { SteamUser } from "@/types/auth";

export type NewUserProfileDraft = {
  displayName: string;
  handle: string;
  bio: string;
  location: string;
  timezone: string;
  pronouns: string;
  avatarUrl: string;
  bannerUrl: string;
};

const PROFILE_STORAGE_KEY_PREFIX = "tempUserProfile:";

export const getProfileStorageKey = (steamId: string) =>
  `${PROFILE_STORAGE_KEY_PREFIX}${steamId}`;

export const buildSteamProfileUrl = (steamId: string) =>
  `https://steamcommunity.com/profiles/${steamId}`;

export const normalizeHandle = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");

export const loadStoredUserProfile = (steamId: string): UserProfile | null => {
  try {
    const raw = localStorage.getItem(getProfileStorageKey(steamId));
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
};

export const persistUserProfile = (steamId: string, profile: UserProfile) => {
  localStorage.setItem(getProfileStorageKey(steamId), JSON.stringify(profile));
};

export const removeStoredUserProfile = (steamId: string) => {
  localStorage.removeItem(getProfileStorageKey(steamId));
};

export const buildTemporaryUserProfile = (
  appUser: AppUser | null,
  steamUser: SteamUser,
  draft: NewUserProfileDraft
): {
  enrichedSteamUser: SteamUser;
  profile: UserProfile;
} => {
  const normalizedHandle = normalizeHandle(draft.handle);
  const steamProfileUrl = steamUser.profileUrl ?? buildSteamProfileUrl(steamUser.steamId);

  const enrichedSteamUser: SteamUser = {
    ...steamUser,
    personaName: steamUser.personaName ?? draft.displayName.trim(),
    profileUrl: steamProfileUrl,
  };

  const profile: UserProfile = {
    user: appUser ?? {
      id: 0,
      roles: ["User"],
    },
    steam: enrichedSteamUser,
    displayName: draft.displayName.trim(),
    handle: normalizedHandle,
    avatarUrl:
      draft.avatarUrl.trim() || steamUser.avatarFullUrl || steamUser.avatarMediumUrl || null,
    bannerUrl: draft.bannerUrl.trim() || null,
    bio: draft.bio.trim() || null,
    location: draft.location.trim() || null,
    timezone: draft.timezone.trim() || null,
    pronouns: draft.pronouns.trim() || null,
    joinedAt: new Date().toISOString(),
    connections: {
      platforms: ["steam"],
      linkedAccounts: [
        {
          platform: "steam",
          usernameOrId: enrichedSteamUser.personaName || steamUser.steamId,
          profileUrl: steamProfileUrl,
          accountVerified: true,
        },
      ],
      socials: [],
    },
    summary: {
      totalAchievements: 0,
      gamesTracked: 0,
      hoursPlayed: 0,
    },
    achievements: [],
    feed: {
      items: [],
      comments: [],
    },
    privacy: {
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

  return { enrichedSteamUser, profile };
};
