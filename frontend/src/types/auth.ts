// src/types/auth.ts
import type { AppUser } from "./models";
import type { UserProfile } from "./profile";

export interface SteamUser {
  steamId: string;
  personaName?: string | null;
  profileUrl?: string | null;
  avatarSmallUrl?: string | null;
  avatarMediumUrl?: string | null;
  avatarFullUrl?: string | null;
}

export interface MeResponse {
  steamId: string;
  appUser?: AppUser | null;
  userProfile?: UserProfile | null;
  handle?: string | null;
}

export interface AuthTokenResponse {
  token: string;
  steamId: string;
  isNewUser: boolean;
  appUserPublicId: string;
  handle?: string | null;
  displayName?: string | null;
}

export type AuthStatus = "loading" | "authenticated" | "guest";
