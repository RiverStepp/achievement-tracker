import type { AppUser } from "./models";
import type { UserProfile } from "./profile";
import type { SteamUser } from "./auth";

export type SettingsSocialPlatform = 1 | 2 | 3;

export type UserSettingsLocation = {
  countryId: number | null;
  countryName: string | null;
  stateRegionId: number | null;
  stateName: string | null;
  cityId: number | null;
  cityName: string | null;
};

export type UserSettingsTimeZone = {
  ianaTimeZoneId: number;
  ianaIdentifier: string;
  displayName: string;
};

export type UserSettingsPronoun = {
  pronounOptionId: number;
  code: string;
  displayLabel: string;
};

export type UserSettingsSocialLink = {
  platform: SettingsSocialPlatform;
  linkValue: string;
  isVisible: boolean;
};

export type UserSettingsMediaAsset = {
  fileName: string | null;
  url: string | null;
};

export type LocationCountryOption = {
  locationCountryId: number;
  isoAlpha2: string;
  name: string;
};

export type LocationStateRegionOption = {
  locationStateRegionId: number;
  locationCountryId: number;
  code: string;
  name: string;
};

export type LocationCityOption = {
  locationCityId: number;
  locationStateRegionId: number;
  name: string;
};

export type IanaTimeZoneOption = {
  ianaTimeZoneId: number;
  ianaIdentifier: string;
  displayName: string;
};

export type PronounOptionItem = {
  pronounOptionId: number;
  code: string;
  displayLabel: string;
};

export type UserSettingsResponse = {
  displayName: string | null;
  handle: string | null;
  bio: string | null;
  location: UserSettingsLocation | null;
  timeZone: UserSettingsTimeZone | null;
  pronouns: UserSettingsPronoun | null;
  socialLinks: UserSettingsSocialLink[];
  profileImage: UserSettingsMediaAsset;
  bannerImage: UserSettingsMediaAsset;
  countries: LocationCountryOption[];
  ianaTimeZones: IanaTimeZoneOption[];
  pronounOptions: PronounOptionItem[];
};

export type UpdateUserSettingsRequest = {
  displayName?: string | null;
  handle?: string | null;
  bio?: string | null;
  location?: {
    countryId?: number | null;
    stateRegionId?: number | null;
    cityId?: number | null;
  } | null;
  unsetLocation?: boolean;
  ianaTimeZoneId?: number | null;
  unsetTimeZone?: boolean;
  pronounOptionId?: number | null;
  unsetPronouns?: boolean;
  unsetProfileImage?: boolean;
  unsetBannerImage?: boolean;
  socialLinks?: Array<{
    platform: SettingsSocialPlatform;
    linkValue?: string | null;
    isVisible: boolean;
  }>;
};

export type MapSettingsToProfileContext = {
  appUser: AppUser | null;
  steamUser: SteamUser | null;
  fallback?: UserProfile | null;
};
