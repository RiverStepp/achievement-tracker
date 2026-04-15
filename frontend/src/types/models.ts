export interface AppUser {
  id: number;
  publicId?: string;
  roles?: AppUserRole[];
  isListedOnLeaderboards?: boolean;
  lastLoginDate?: string;
}

export type AppUserRole = "User" | "Admin" | "Moderator";

export type User = AppUser;

export interface Game {
  id: number;
  steamAppId: number;
  name: string;
  iconUrl?: string;
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
  globalPercentage?: number;
}

export interface AchievementStats {
  achievementId: number;
  globalPercentage: number;
  updatedAt?: string;
}
