export type Platform = 'steam' | 'xbox' | 'psn' | 'switch' | 'pc';

export interface LinkedAccount {
  platform: Platform;
  usernameOrId: string;
  profileUrl: string;
  accountVerified?: boolean;
}

export interface SocialLink {
  kind: 'discord' | 'x' | 'twitch' | 'github' | 'website';
  url: string;
}

export interface GamePin {
  title: string;
  statLabel: string;
  value?: string | number;
  achievementIconUrl?: string;
}

export interface UserProfile {
  id: string;
  handle: string;
  avatarUrl: string;
  bannerUrl?: string;
  bio?: string;
  location?: string;
  joinDate: string;
  platforms: Platform[];
  linkedAccounts: LinkedAccount[];
  socials: SocialLink[];
  favoriteGenres: string[];
  favoriteGames: string[];
  totalAchievements: number;
  hoursPlayed: number;
  gamesOwned: number;
  pins: GamePin[];
  activity: Array<{
    id: string;
    ts: string;
    kind: 'achievement' | 'game_added' | 'badge';
    title: string;
    subtitle?: string;
    icon?: string;
  }>;
  privacy: {
    showStats: boolean;
    showActivity: boolean;
    showLinkedAccounts: boolean;
  };
}
