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
  appid?: number;
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
  /**
   * Optional JSON output file path. Only used when writeOutputFile is true.
   */
  outputFile?: string;
  /**
   * When true, write a JSON file to outputFile (if provided).
   * When false/undefined, do not write files.
   */
  writeOutputFile?: boolean;
  /**
   * When true/undefined, persist results to the database.
   * When false, scraper will not write to the database (useful for pure JSON output flows).
   */
  saveToDatabase?: boolean;
  resumeFrom?: string;
}

export interface RateLimitInfo {
  requestsPer10Seconds: number;
  requestsPerDay: number;
  currentRequests: number;
  resetTime: number;
}