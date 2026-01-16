// src/types/models.ts

export interface User {
  id: number;
  steamId: string;        // BIGINT → string on FE
  handle: string;         // URL handle, e.g. "SakaKishiyami"
  username: string;       // display name
  profileUrl?: string;
  avatarUrl?: string;
  createdAt?: string;     // ISO string
}

export interface Game {
  id: number;
  steamAppId: number;
  name: string;
  headerImageUrl?: string;
  shortDescription?: string;
  metacriticScore?: number;
  recommendations?: number;
  isUnlisted?: boolean;
  isRemoved?: boolean;
  mainStoryHours?: number;
  mainSidesHours?: number;
  completionistHours?: number;
  allStylesHours?: number;
  alias?: string;
  scoreRank?: number;
  minOwners?: number;
  maxOwners?: number | null;
  peakCcu?: number;
}

export interface Achievement {
  id: number;
  gameId: number;
  steamApiname: string;
  name: string;
  description?: string;
  iconUrl?: string;
  points?: number;
  isHidden?: boolean;
  createdAt?: string;
  descriptionSource?: string;
  lastUpdated?: string;
}

export interface UserAchievement {
  id: number;
  userId: number;
  achievementId: number;
  unlockedAt?: string;
  createdAt?: string;
}

export interface AchievementStats {
  achievementId: number;
  globalPercentage: number;
  updatedAt?: string;
}
