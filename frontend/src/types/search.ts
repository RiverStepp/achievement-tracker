export type AchievementSearchResult = {
  achievementId: number;
  achievementName: string;
  achievementDescription: string | null;
  achievementIconUrl: string | null;
  achievementPoints: number;
  globalPercentage: number | null;
  gameId: number;
  gameName: string;
  gameHeaderImageUrl: string | null;
};

export type PagedResult<T> = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  items: T[];
};
