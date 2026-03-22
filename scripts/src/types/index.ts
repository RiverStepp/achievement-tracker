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
  playtime_2weeks?: number;
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
  // for GetPlayerAchievements only. Steam often 403s parallel calls; default 1.
  achievementConcurrency?: number;
  // If true, scan every owned game for achievements even when the profile is an incremental update
  // (otherwise only scans games with playtime in the last 2 weeks).
  forceFullAchievementSync?: boolean;
  // Per-game console progress between rate-limit waits. Default on; set false for API-spawned runs.
  scrapeProgressLog?: boolean;
  outputFile?: string;
  writeOutputFile?: boolean;
  saveToDatabase?: boolean;
  resumeFrom?: string;
}

export interface RateLimitInfo {
  requestsPer10Seconds: number;
  requestsPerDay: number;
  currentRequests: number;
  resetTime: number;
  maxPerSecond: number;
  maxPerMinute: number;
  requestsInLastMinute: number;
  dailyCap: number;
  /** UTC ms; if > Date.now(), client is in a 429 cooldown */
  cooldownUntilMs: number;
}