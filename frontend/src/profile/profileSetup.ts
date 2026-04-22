import type { UserProfile } from "@/types/profile";

export type NewUserProfileDraft = {
  displayName: string;
  handle: string;
  bio: string;
  countryId: number | null;
  stateRegionId: number | null;
  cityId: number | null;
  ianaTimeZoneId: number | null;
  pronounOptionId: number | null;
  socials: Array<{
    platform: 1 | 2 | 3;
    linkValue: string;
    isVisible: boolean;
  }>;
  profileImageFile: File | null;
  bannerImageFile: File | null;
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
