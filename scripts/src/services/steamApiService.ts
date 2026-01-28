import axios, { AxiosResponse } from 'axios';
import { SteamUser, SteamGame, SteamAchievement, SteamGameStats } from '../types';
import { RateLimiter } from '../utils/rateLimiter';

export class SteamApiService {
  private apiKey: string;
  private rateLimiter: RateLimiter;
  private baseUrl = 'https://api.steampowered.com';
  private trackingApiUrl: string | null = null;
  private cancellationToken: { cancelled: boolean } = { cancelled: false };
  private isInvokedThroughApi: boolean = false;

  constructor(apiKey: string, trackingApiUrl?: string, isInvokedThroughApi: boolean = false) {
    this.apiKey = apiKey;
    this.rateLimiter = new RateLimiter();
    this.trackingApiUrl = trackingApiUrl || process.env.TRACKING_API_URL || null;
    this.isInvokedThroughApi = isInvokedThroughApi;
    this.rateLimiter.setCancellationToken(this.cancellationToken);
  }

  setCancellationToken(token: { cancelled: boolean }): void {
    this.cancellationToken = token;
    this.rateLimiter.setCancellationToken(token);
  }

  /**
   * List of all Steam API endpoints we call
   */
  static readonly STEAM_ENDPOINTS = {
    RESOLVE_VANITY_URL: '/ISteamUser/ResolveVanityURL/v0001/',
    GET_PLAYER_SUMMARIES: '/ISteamUser/GetPlayerSummaries/v0002/',
    GET_OWNED_GAMES: '/IPlayerService/GetOwnedGames/v0001/',
    GET_PLAYER_ACHIEVEMENTS: '/ISteamUserStats/GetPlayerAchievements/v0001/',
    GET_USER_STATS_FOR_GAME: '/ISteamUserStats/GetUserStatsForGame/v0002/',
    GET_SCHEMA_FOR_GAME: '/ISteamUserStats/GetSchemaForGame/v0002/'
  } as const;

  /**
   * Make a tracked API call to Steam
   */
  private async makeTrackedApiCall<T>(
    endpoint: string,
    params: Record<string, any>
  ): Promise<AxiosResponse<T>> {
    // Check for cancellation before making request
    if (this.cancellationToken.cancelled) {
      throw new Error('Operation cancelled');
    }

    // Skip rate limiting if invoked through API (API handles rate limiting)
    if (!this.isInvokedThroughApi) {
      await this.rateLimiter.waitIfNeeded();
    }

    const startTime = Date.now();
    const fullUrl = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await axios.get<T>(fullUrl, { params });
      const responseTime = Date.now() - startTime;

      // Record successful call
      await this.recordApiCall(endpoint, 'GET', response.status, responseTime, params);

      return response;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const statusCode = error.response?.status || 0;
      const errorMessage = error.message || 'Unknown error';

      // Record failed call
      await this.recordApiCall(endpoint, 'GET', statusCode, responseTime, params, errorMessage);

      throw error;
    }
  }

  /**
   * Record an API call to the tracking service
   */
  private async recordApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTimeMs: number,
    requestParams?: Record<string, any>,
    errorMessage?: string
  ): Promise<void> {
    if (!this.trackingApiUrl) {
      // No tracking URL configured, skip silently
      return;
    }

    try {
      // Convert params to string dictionary (remove API key for security)
      const safeParams: Record<string, string> = {};
      if (requestParams) {
        for (const [key, value] of Object.entries(requestParams)) {
          if (key !== 'key' && key !== 'steamApiKey') {
            safeParams[key] = String(value);
          }
        }
      }

      await axios.post(
        `${this.trackingApiUrl}/api/steam-api/record`,
        {
          endpoint,
          method,
          statusCode,
          responseTimeMs,
          requestParams: Object.keys(safeParams).length > 0 ? safeParams : undefined,
          errorMessage
        },
        {
          timeout: 2000, // Don't wait too long for tracking
          validateStatus: () => true // Don't throw on tracking errors
        }
      );
    } catch (error) {
      // Silently fail tracking - don't interrupt main flow
      console.debug('Failed to record API call:', error);
    }
  }

  /**
   * Resolves a Steam username/custom URL to Steam ID 64-bit
   * @param username Steam username or custom URL (e.g., "MyUsername" or "76561198046029799")
   * @returns Steam ID 64-bit string, or null if not found
   */
  async resolveUsername(username: string): Promise<string | null> {
    // If it's already a Steam ID (numeric), return it
    if (/^\d+$/.test(username)) {
      return username;
    }

    try {
      const response = await this.makeTrackedApiCall<{ response: { success: number; steamid?: string } }>(
        SteamApiService.STEAM_ENDPOINTS.RESOLVE_VANITY_URL,
        {
          key: this.apiKey,
          vanityurl: username
        }
      );

      if (response.data.response.success === 1) {
        return response.data.response.steamid || null;
      }

      return null;
    } catch (error) {
      console.error(`Error resolving username ${username}:`, error);
      throw error;
    }
  }

  async getUserProfile(steamId: string): Promise<SteamUser | null> {
    try {
      const response = await this.makeTrackedApiCall<{ response: { players: SteamUser[] } }>(
        SteamApiService.STEAM_ENDPOINTS.GET_PLAYER_SUMMARIES,
        {
          key: this.apiKey,
          steamids: steamId
        }
      );

      if (response.data.response.players.length === 0) {
        return null;
      }

      return response.data.response.players[0];
    } catch (error) {
      console.error(`Error fetching user profile for ${steamId}:`, error);
      throw error;
    }
  }

  async getUserGames(steamId: string): Promise<SteamGame[]> {
    try {
      const response = await this.makeTrackedApiCall<{ response: { games?: SteamGame[] } }>(
        SteamApiService.STEAM_ENDPOINTS.GET_OWNED_GAMES,
        {
          key: this.apiKey,
          steamid: steamId,
          include_appinfo: true,
          include_played_free_games: true
        }
      );

      return response.data.response.games || [];
    } catch (error) {
      console.error(`Error fetching games for ${steamId}:`, error);
      throw error;
    }
  }

  async getUserAchievements(steamId: string, appId: number): Promise<SteamAchievement[]> {
    try {
      const response = await this.makeTrackedApiCall<{ playerstats?: { achievements?: SteamAchievement[] } }>(
        SteamApiService.STEAM_ENDPOINTS.GET_PLAYER_ACHIEVEMENTS,
        {
          key: this.apiKey,
          steamid: steamId,
          appid: appId
        }
      );

      return response.data.playerstats?.achievements || [];
    } catch (error) {
      console.error(`Error fetching achievements for ${steamId} in game ${appId}:`, error);
      throw error;
    }
  }

  async getUserStatsForGame(steamId: string, appId: number): Promise<any> {
    try {
      const response = await this.makeTrackedApiCall<{ playerstats: any }>(
        SteamApiService.STEAM_ENDPOINTS.GET_USER_STATS_FOR_GAME,
        {
          key: this.apiKey,
          steamid: steamId,
          appid: appId
        }
      );

      return response.data.playerstats;
    } catch (error) {
      console.error(`Error fetching stats for ${steamId} in game ${appId}:`, error);
      throw error;
    }
  }

  async getGameSchema(appId: number): Promise<any> {
    try {
      const response = await this.makeTrackedApiCall<{ game: any }>(
        SteamApiService.STEAM_ENDPOINTS.GET_SCHEMA_FOR_GAME,
        {
          key: this.apiKey,
          appid: appId
        }
      );

      return response.data.game;
    } catch (error) {
      console.error(`Error fetching schema for game ${appId}:`, error);
      throw error;
    }
  }

  getRateLimitInfo() {
    return this.rateLimiter.getRateLimitInfo();
  }
}