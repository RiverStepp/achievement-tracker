// src/types/profile.ts
import type { Achievement, Game, User } from "./models";
import type { Post} from "./post";

export type Platform = "steam" | "xbox" | "psn" | "switch" | "pc";

export interface LinkedAccount {
  platform: Platform;
  usernameOrId: string;
  profileUrl: string;
  accountVerified?: boolean;
}

export type SocialKind = "discord" | "x" | "twitch" | "github" | "website";

export interface SocialLink {
  kind: SocialKind;
  url: string;
}

export interface ViewerContext {
  isSelf: boolean;
}
export interface ProfileIdentity {
  displayName: string; // “username” in the UI (not the handle)
  handle: string;      // @handle (unique)
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  location: string | null;
  timezone: string | null;
  pronouns?: string | null;
  joinedAt: string; // ISO (mirror user.createdAt)
}

export interface ProfileEditPayload {
  displayName?: string;
  handle?: string; // if you allow handle changes; consider cooldown server-side
  avatarUrl?: string | null;
  bannerUrl?: string | null;

  bio?: string | null;
  location?: string | null;
  timezone?: string | null;
  pronouns?: string | null;

  socials?: SocialLink[];

  pinnedGenreTags?: string[];
  pinnedAchievementIds?: number[]; // store IDs, server can hydrate to UI objects
}
export interface ProfileAchievement {
  id: number;
  unlockedAt: string;
  isPinned?: boolean;
  achievement: Achievement;
  game: Pick<Game, "id" | "name" | "steamAppId" | "headerImageUrl">;
  globalPercentage?: number; // rarity
}
export interface ProfileSummaryStats {
  totalAchievements: number;
  gamesTracked: number;
  hoursPlayed?: number;
}

export interface ProfileConnections {
  platforms: Platform[];
  linkedAccounts: LinkedAccount[];
  socials: SocialLink[];
}
export interface ProfilePrivacy {
  showStats: boolean;
  showRecentAchievements: boolean;
  showLinkedAccounts: boolean;
  showSocialLinks: boolean;
  showFeed: boolean; // if you ever allow private profiles
}
export interface UserProfile {
  user: User
  identity: ProfileIdentity;
  connections: ProfileConnections;
  summary?: ProfileSummaryStats; 
  achievements?: ProfileAchievement[];
  feed?: {
    items: Post[];
  };
  privacy: ProfilePrivacy;
  viewer: ViewerContext;
}
