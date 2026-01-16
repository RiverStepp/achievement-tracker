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

export interface GamePin {
  title: string;
  statLabel: string;
  value?: string | number;
  achievementIconUrl?: string;
}

export interface ActivityItem {
  id: string;
  ts: string; // ISO
  kind: "achievement" | "game_added" | "badge";
  title: string;
  subtitle?: string;
  icon?: string;
}

// Achievement plus game + stats, already joined for the UI
export interface ProfileAchievement {
  id: number;
  unlockedAt: string;
  achievement: Achievement;
  game: Pick<Game, "id" | "name" | "steamAppId" | "headerImageUrl">;
  globalPercentage?: number;
}

// This is what /profiles/:handle should return
export interface UserProfile {
  user: User; // includes handle, username, avatar, etc.

  joinDate: string;       // you can just mirror user.createdAt
  platforms: Platform[];
  linkedAccounts: LinkedAccount[];
  socials: SocialLink[];

  favoriteGenres: string[];
  favoriteGames: string[];

  summary: {
    totalAchievements: number;
    hoursPlayed: number;
    gamesOwned: number;
  };

  pins: GamePin[];

  latestAchievements: ProfileAchievement[];

  activity: ActivityItem[];

  privacy: {
    showStats: boolean;
    showActivity: boolean;
    showLinkedAccounts: boolean;
  };
}
