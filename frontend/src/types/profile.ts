// src/types/profile.ts
import type { Achievement, Game, User } from "./models";

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

/**
 * Viewer relationship model
 * - DM is enabled only when status === "friends"
 */
export type FriendStatus = "none" | "outgoing_pending" | "incoming_pending" | "friends" | "blocked";

export interface ViewerContext {
  isSelf: boolean;
  //friendStatus: FriendStatus;
  canMessage: boolean; // derived from friendStatus === "friends" (or isSelf if you allow self-DM testing)
  canSendFriendRequest: boolean;
  canAcceptFriendRequest: boolean;
}

/**
 * Twitter-style identity block for profile header
 * These are the fields you render in the header.
 */
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

/**
 * Editable fields payload (what the client would send to PATCH /profile)
 * Keep it small + explicit so you don’t accidentally allow editing derived fields.
 */
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

/**
 * Achievements shown in profile sections
 * This is a UI-joined object: achievement + game + rarity info.
 */
export interface ProfileAchievement {
  id: number; // unlock row id or achievement id depending on your schema — just be consistent
  unlockedAt: string; // ISO
  achievement: Achievement;
  game: Pick<Game, "id" | "name" | "steamAppId" | "headerImageUrl">;
  globalPercentage?: number; // rarity
}

/**
 * Pinned achievement card (often same as ProfileAchievement but you might want extra metadata)
 */
export interface PinnedAchievement extends ProfileAchievement {
  pinnedAt?: string; // ISO (optional)
  note?: string;     // optional future: "why I pinned it"
}

/**
 * Recent achievement activity rail (right panel)
 */
export interface RecentAchievementItem {
  id: string;
  ts: string; // ISO
  achievement: ProfileAchievement;
}

/**
 * Basic public stats (only show if privacy allows)
 * Keep it minimal for now — you can expand later.
 */
export interface ProfileSummaryStats {
  totalAchievements: number;
  gamesTracked: number;
  hoursPlayed?: number; // optional because hours can be missing/unknown
}

/**
 * Platforms + accounts
 */
export interface ProfileConnections {
  platforms: Platform[]; // badges shown on profile
  linkedAccounts: LinkedAccount[];
  socials: SocialLink[];
}

/**
 * Profile customization / showcases
 */
export interface ProfileShowcase {
  pinnedAchievements: PinnedAchievement[];
  pinnedGenreTags: string[];
}

/**
 * A post in the center feed.
 * Keep this minimal now; you can extend with likes/replies later.
 */
export interface ProfilePost {
  id: string;
  createdAt: string; // ISO
  body: string;

  // Optional "achievement embed" if user posts about an unlock
  attachedAchievement?: ProfileAchievement;

  // Basic engagement (optional; set undefined if you haven't built it yet)
  likeCount?: number;
  replyCount?: number;

  // Viewer-specific booleans for UI buttons
  viewerHasLiked?: boolean;
}

/**
 * Profile privacy controls
 * These should match what your UI actually needs.
 */
export interface ProfilePrivacy {
  showStats: boolean;
  showRecentAchievements: boolean;
  showLinkedAccounts: boolean;
  showSocialLinks: boolean;
  showFeed: boolean; // if you ever allow private profiles
}

/**
 * The response shape for GET /profiles/:handle
 */
export interface UserProfile {
  user: User
  identity: ProfileIdentity;
  connections: ProfileConnections;
  showcase: ProfileShowcase;

  summary?: ProfileSummaryStats; // omitted if privacy.showStats === false
  recentAchievements?: RecentAchievementItem[]; // omitted if privacy.showRecentAchievements === false
  feed?: {
    items: ProfilePost[];
    nextCursor?: string; // for pagination
  };

  privacy: ProfilePrivacy;

  // Viewer-specific relationship info (changes depending on who is viewing)
  viewer: ViewerContext;
}
