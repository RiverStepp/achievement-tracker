export interface SteamUser {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  personastate: number;
  communityvisibilitystate: number;
  profilestate: number;
  lastlogoff: number;
  commentpermission: number;
}

export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  playtime_2weeks: number;
  img_icon_url: string;
  img_logo_url: string;
  has_community_visible_stats: boolean;
}

export interface SteamAchievement {
  apiname: string;
  achieved: number;
  unlocktime: number;
  name?: string;
  description?: string;
}

export interface SteamGameStats {
  steamID: string;
  gameName: string;
  achievements: SteamAchievement[];
  stats?: any;
}

export interface ScrapingProgress {
  totalUsers: number;
  completedUsers: number;
  currentUser: string;
  errors: number;
  achievementsFound: number;
}

export interface ScrapingConfig {
  steamApiKey: string;
  maxConcurrentRequests: number;
  requestDelay: number;
  maxRetries: number;
  outputFile: string;
  resumeFrom?: string;
}

export interface RateLimitInfo {
  requestsPer10Seconds: number;
  requestsPerDay: number;
  currentRequests: number;
  resetTime: number;
}