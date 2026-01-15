export type User = {
  id: number;
  steamId: string;
  username: string;
  profileUrl: string;
  avatarUrl: string;
  createdAt: string;
};

export type Game = {
  id: number;
  steamAppid: number | null;
  name: string;
  releaseDate: string | null;
  developer: string | null;
  publisher: string | null;
  genres: unknown;
  headerImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Achievement = {
  id: number;
  gameId: number;
  steamApiname: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  points: number | null;
  isHidden: boolean;
  createdAt: string;
};

export type UserAchievement = {
  id: number;
  userId: number;
  achievementId: number;
  unlockedAt: string | null;
  createdAt: string;
};

export type AchievementStat = {
  achievementId: number;
  globalPercentage: number;
  updatedAt: string;
};