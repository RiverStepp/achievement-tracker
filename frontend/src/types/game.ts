export type GameDetailsAchievement = {
  achievementId: number;
  name: string;
  description: string | null;
  iconUrl: string | null;
  points: number;
  isHidden: boolean;
  isUnobtainable: boolean;
  isBuggy: boolean;
  isConditionallyObtainable: boolean;
  isMultiplayer: boolean;
  isMissable: boolean;
  isGrind: boolean;
  isRandom: boolean;
  isDateSpecific: boolean;
  isViral: boolean;
  isDLC: boolean;
  isWorldRecord: boolean;
  globalPercentage: number | null;
  isUnlocked: boolean | null;
};
 
export type GameDetailsAuthenticatedProgress = {
  pointsEarned: number;
  unlockedAchievementCount: number;
  lockedAchievementCount: number;
  achievementCompletionPercent: number | null;
};
 
export type GameDetails = {
  isAuthenticated: boolean;
  gameName: string;
  headerImageUrl: string | null;
  steamAppId: number;
  releaseDate: string | null;
  shortDescription: string | null;
  isRemoved: boolean;
  isUnlisted: boolean;
  totalAvailablePoints: number;
  authenticatedProgress: GameDetailsAuthenticatedProgress | null;
  achievements: GameDetailsAchievement[];
};
