// src/types/profile.ts
import type { Achievement, AppUser, Game } from "./models";
import type { SteamUser } from "./auth";
import type { Comment, Post } from "./post";

export type Platform = "steam" | "xbox" | "psn" | "switch" | "pc";

export interface LinkedAccount {
  platform: Platform;
  usernameOrId: string;
  profileUrl: string;
  accountVerified?: boolean;
}

export type SocialKind = "discord" | "youtube" | "x" | "twitch" | "github" | "website";

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
  pinnedAchievementIds?: number[];
}
export interface ProfileAchievement {
  id: number;
  steamAchievementId?: number;
  pinnedAchievementId?: number;
  unlockedAt: string;
  isPinned?: boolean;
  achievement: Achievement;
  game: Pick<Game, "id" | "name" | "steamAppId" | "headerImageUrl" | "iconUrl">;
}

export interface ProfileGame {
  id: number;
  name: string;
  playtimeForever?: number | null;
  earnedCount: number;
  totalAchievements: number;
  percentCompletion?: number | null;
  isCompleted: boolean;
  pointsEarned: number;
  pointsAvailable: number;
  latestUnlockDate: string;
  durationMinutes?: number | null;
  game: Pick<Game, "id" | "name" | "steamAppId" | "headerImageUrl" | "iconUrl">;
}

export type ProfileLatestActivityKind = "achievement" | "post" | "comment";

export interface ProfileLatestActivityItem {
  id: string;
  kind: ProfileLatestActivityKind;
  occurredAt: string;
  title: string;
  detail: string;
  postPublicId?: string | null;
  commentPublicId?: string | null;
}
export interface ProfileSummaryStats {
  totalAchievements: number;
  gamesTracked: number;
  hoursPlayed?: number;
  totalPoints?: number;
  gamesAt100Percent?: number;
  startedGamesCount?: number;
  avgCompletionPercent?: number | null;
}

export type ProfileAchievementSortMode = "latest" | "points";

export interface ProfileSteamSyncMeta {
  lastCheckedDate: string | null;
  lastSyncedDate: string | null;
  isPrivate: boolean;
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
  showFeed: boolean;
}
export interface UserProfile extends ProfileIdentity {
  user: AppUser;
  steam?: SteamUser | null;
  connections: ProfileConnections;
  summary?: ProfileSummaryStats;
  games?: ProfileGame[];
  achievements?: ProfileAchievement[];
  achievementsByLatestUnlock?: ProfileAchievement[];
  achievementsByPointsOrder?: ProfileAchievement[];
  steamSync?: ProfileSteamSyncMeta | null;
  isClaimed?: boolean | null;
  latestActivity?: ProfileLatestActivityItem[];
  feed?: {
    items: Post[];
    comments?: Comment[];
  };
  privacy: ProfilePrivacy;
  viewer: ViewerContext;
}
