import axios, { AxiosResponse, isAxiosError } from 'axios';
import { RateLimitInfo, SteamAchievement, SteamGame, SteamUser } from '../types';
import { RateLimiter } from '../utils/rateLimiter';
import { isSteamId64 } from '../utils/steamHelpers';
import {
  GetOwnedGamesResponse,
  GetPlayerAchievementsResponse,
  GetPlayerSummariesResponse,
  GetSchemaForGameResponse,
  GetUserStatsForGameResponse,
  ResolveVanityUrlResponse,
} from './steamApiTypes';

const STEAM_REQUEST_TIMEOUT_MS = 10_000;
const TRACKING_POST_TIMEOUT_MS = 2_000;
const ACHIEVEMENT_FETCH_MAX_ATTEMPTS = 5;
/** Exponential backoff base (ms); jitter added separately to reduce synchronized retries. */
const ACHIEVEMENT_RETRY_BASE_MS = 2_000;
const ACHIEVEMENT_RETRY_JITTER_MS = 800;

export type SteamUserProfileResult = {
  user: SteamUser | null;
  steamBody: Record<string, unknown> | null;
};

export type SteamOwnedGamesResult = {
  games: SteamGame[];
  steamBody: Record<string, unknown> | null;
};

export type SteamPlayerAchievementsResult = {
  achievements: SteamAchievement[];
  httpStatus: number;
  steamBody: Record<string, unknown> | null;
};

export class SteamApiService {
  private readonly apiKey: string;
  private readonly rateLimiter: RateLimiter;
  private readonly baseUrl: string;
  private readonly trackingApiUrl: string | null = null;
  private cancellationToken: { cancelled: boolean } = { cancelled: false };
  private readonly isInvokedThroughApi: boolean = false;
  private readonly requestTimeout = STEAM_REQUEST_TIMEOUT_MS;

  constructor(apiKey: string, trackingApiUrl?: string, isInvokedThroughApi: boolean = false) {
    this.apiKey = apiKey;
    this.rateLimiter = new RateLimiter();
    this.baseUrl = process.env.STEAM_API_BASE_URL || 'https://api.steampowered.com';
    this.trackingApiUrl = trackingApiUrl || process.env.TRACKING_API_URL || null;
    this.isInvokedThroughApi = isInvokedThroughApi;
    this.rateLimiter.setCancellationToken(this.cancellationToken);
  }

  setCancellationToken(token: { cancelled: boolean }): void {
    this.cancellationToken = token;
    this.rateLimiter.setCancellationToken(token);
  }

  static readonly STEAM_ENDPOINTS = {
    RESOLVE_VANITY_URL: '/ISteamUser/ResolveVanityURL/v0001/',
    GET_PLAYER_SUMMARIES: '/ISteamUser/GetPlayerSummaries/v0002/',
    GET_OWNED_GAMES: '/IPlayerService/GetOwnedGames/v0001/',
    GET_PLAYER_ACHIEVEMENTS: '/ISteamUserStats/GetPlayerAchievements/v0001/',
    GET_USER_STATS_FOR_GAME: '/ISteamUserStats/GetUserStatsForGame/v0002/',
    GET_SCHEMA_FOR_GAME: '/ISteamUserStats/GetSchemaForGame/v0002/',
  } as const;

  /** Direct calls to api.steampowered.com use our RateLimiter; API-spawned runs skip it. */
  private useClientSteamThrottle(): boolean {
    return !this.isInvokedThroughApi;
  }

  private maybeNote429(headers: unknown): void {
    if (this.useClientSteamThrottle()) {
      this.rateLimiter.noteHttp429(headers);
    }
  }

  private static achievementRetryDelayMs(attemptIndex: number): number {
    return ACHIEVEMENT_RETRY_BASE_MS * 2 ** attemptIndex + Math.random() * ACHIEVEMENT_RETRY_JITTER_MS;
  }

  /**
   * All Steam GETs go through here: cancel check, client throttle, optional validateStatus,
   * tracking POST, 429 → global cooldown.
   */
  private async makeTrackedSteamGet<T>(
    endpoint: string,
    params: Record<string, unknown>,
    options?: { validateStatus?: (status: number) => boolean },
  ): Promise<AxiosResponse<T>> {
    if (this.cancellationToken.cancelled) {
      throw new Error('Operation cancelled');
    }
    if (this.useClientSteamThrottle()) {
      await this.rateLimiter.waitIfNeeded();
    }

    const startTime = Date.now();
    const fullUrl = `${this.baseUrl}${endpoint}`;

    try {
      const response = await axios.get<T>(fullUrl, {
        params,
        timeout: this.requestTimeout,
        ...(options?.validateStatus ? { validateStatus: options.validateStatus } : {}),
      });
      const responseTime = Date.now() - startTime;
      await this.recordApiCall(endpoint, 'GET', response.status, responseTime, params);

      if (response.status === 429) {
        this.maybeNote429(response.headers);
      }

      return response;
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      let statusCode = 0;
      let errorMessage = 'Unknown error';
      let responseHeaders: unknown;

      if (isAxiosError(error)) {
        statusCode = error.response?.status ?? 0;
        errorMessage = error.message;
        responseHeaders = error.response?.headers;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      await this.recordApiCall(endpoint, 'GET', statusCode, responseTime, params, errorMessage);

      if (statusCode === 429) {
        this.maybeNote429(responseHeaders);
      }

      throw error;
    }
  }

  private async makeTrackedApiCall<T>(
    endpoint: string,
    params: Record<string, unknown>,
  ): Promise<AxiosResponse<T>> {
    return this.makeTrackedSteamGet<T>(endpoint, params);
  }

  private async recordApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTimeMs: number,
    requestParams?: Record<string, unknown>,
    errorMessage?: string,
  ): Promise<void> {
    if (!this.trackingApiUrl) {
      return;
    }

    try {
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
          errorMessage,
        },
        {
          timeout: TRACKING_POST_TIMEOUT_MS,
          validateStatus: () => true,
        },
      );
    } catch {
      console.debug('Failed to record API call');
    }
  }

  async resolveUsername(username: string): Promise<string | null> {
    if (isSteamId64(username)) {
      return username;
    }

    try {
      const response = await this.makeTrackedApiCall<ResolveVanityUrlResponse>(
        SteamApiService.STEAM_ENDPOINTS.RESOLVE_VANITY_URL,
        {
          key: this.apiKey,
          vanityurl: username,
        },
      );

      if (!response.data?.response) {
        console.error('Invalid response structure from ResolveVanityURL');
        return null;
      }

      if (response.data.response.success === 1 && response.data.response.steamid) {
        return response.data.response.steamid;
      }

      return null;
    } catch (error) {
      console.error(`Error resolving username ${username}:`, error);
      throw error;
    }
  }

  async getUserProfile(steamId: string): Promise<SteamUserProfileResult> {
    try {
      const response = await this.makeTrackedApiCall<GetPlayerSummariesResponse>(
        SteamApiService.STEAM_ENDPOINTS.GET_PLAYER_SUMMARIES,
        {
          key: this.apiKey,
          steamids: steamId,
        },
      );

      const steamBody =
        response.data != null && typeof response.data === 'object'
          ? (response.data as unknown as Record<string, unknown>)
          : null;

      if (!response.data?.response?.players || !Array.isArray(response.data.response.players)) {
        console.error('Invalid response structure from GetPlayerSummaries');
        return { user: null, steamBody };
      }

      if (response.data.response.players.length === 0) {
        return { user: null, steamBody };
      }

      return { user: response.data.response.players[0], steamBody };
    } catch (error) {
      console.error(`Error fetching user profile for ${steamId}:`, error);
      throw error;
    }
  }

  private parseOwnedGamesPayload(data: GetOwnedGamesResponse | undefined): SteamGame[] {
    const r = data?.response;
    if (!r) return [];
    const g = r.games;
    if (Array.isArray(g)) return g;
    if (g && typeof g === 'object') return Object.values(g as Record<string, SteamGame>);
    return [];
  }

  private toJsonObjectBody(data: unknown): Record<string, unknown> | null {
    if (data != null && typeof data === 'object' && !Array.isArray(data)) {
      return data as Record<string, unknown>;
    }
    return null;
  }

  async getUserGames(steamId: string): Promise<SteamOwnedGamesResult> {
    try {
      const response = await this.makeTrackedApiCall<GetOwnedGamesResponse>(
        SteamApiService.STEAM_ENDPOINTS.GET_OWNED_GAMES,
        {
          key: this.apiKey,
          steamid: steamId,
          include_appinfo: 1,
          include_played_free_games: 1,
        },
      );

      let games = this.parseOwnedGamesPayload(response.data);
      if (games.length > 0) {
        return { games, steamBody: this.toJsonObjectBody(response.data) };
      }

      const retry = await this.makeTrackedApiCall<GetOwnedGamesResponse>(
        SteamApiService.STEAM_ENDPOINTS.GET_OWNED_GAMES,
        {
          key: this.apiKey,
          steamid: steamId,
          include_played_free_games: 1,
        },
      );
      games = this.parseOwnedGamesPayload(retry.data);
      return { games, steamBody: this.toJsonObjectBody(retry.data) };
    } catch (error) {
      console.error(`Error fetching games for ${steamId}:`, error);
      throw error;
    }
  }

  private parsePlayerAchievementsBody(data: GetPlayerAchievementsResponse | undefined): SteamAchievement[] {
    const ps = data?.playerstats;
    if (!ps) return [];
    if (typeof ps.error === 'string' && ps.error.length > 0) return [];
    if (ps.success === false) return [];
    return ps.achievements || [];
  }

  /**
   * Uses validateStatus so statuses below 500 become a normal axios response (not thrown).
   * 403 / 429: retry with exponential backoff + jitter; other 4xx: empty achievements + status.
   */
  async getUserAchievements(steamId: string, appId: number): Promise<SteamPlayerAchievementsResult> {
    const endpoint = SteamApiService.STEAM_ENDPOINTS.GET_PLAYER_ACHIEVEMENTS;
    const params = { key: this.apiKey, steamid: steamId, appid: appId };
    /** Axios default throws on 4xx/5xx; this keeps 4xx as a response for branching logic. */
    const treatClientErrorsAsResponses = (status: number) => status >= 200 && status < 500;

    let lastStatus = 0;
    let lastBody: Record<string, unknown> | null = null;

    for (let attempt = 0; attempt < ACHIEVEMENT_FETCH_MAX_ATTEMPTS; attempt++) {
      if (this.cancellationToken.cancelled) {
        throw new Error('Operation cancelled');
      }

      try {
        const response = await this.makeTrackedSteamGet<GetPlayerAchievementsResponse>(endpoint, params, {
          validateStatus: treatClientErrorsAsResponses,
        });

        lastStatus = response.status;
        lastBody = this.toJsonObjectBody(response.data);

        if (response.status === 200) {
          return {
            achievements: this.parsePlayerAchievementsBody(response.data),
            httpStatus: 200,
            steamBody: lastBody,
          };
        }

        const retryable = response.status === 403 || response.status === 429;
        if (retryable && attempt < ACHIEVEMENT_FETCH_MAX_ATTEMPTS - 1) {
          await new Promise((r) => setTimeout(r, SteamApiService.achievementRetryDelayMs(attempt)));
          continue;
        }

        return { achievements: [], httpStatus: lastStatus, steamBody: lastBody };
      } catch (error: unknown) {
        let statusCode = 0;
        if (isAxiosError(error)) {
          statusCode = error.response?.status ?? 0;
        }

        lastStatus = statusCode;
        if (isAxiosError(error) && error.response?.data != null && typeof error.response.data === 'object') {
          lastBody = error.response.data as Record<string, unknown>;
        }

        const retryable = statusCode === 403 || statusCode === 429;
        if (retryable && attempt < ACHIEVEMENT_FETCH_MAX_ATTEMPTS - 1) {
          await new Promise((r) => setTimeout(r, SteamApiService.achievementRetryDelayMs(attempt)));
          continue;
        }

        const message = error instanceof Error ? error.message : String(error);
        console.error(`Error fetching achievements for ${steamId} in game ${appId}:`, message);
        throw error;
      }
    }

    return { achievements: [], httpStatus: lastStatus, steamBody: lastBody };
  }

  async getUserStatsForGame(steamId: string, appId: number): Promise<unknown> {
    try {
      const response = await this.makeTrackedApiCall<GetUserStatsForGameResponse>(
        SteamApiService.STEAM_ENDPOINTS.GET_USER_STATS_FOR_GAME,
        {
          key: this.apiKey,
          steamid: steamId,
          appid: appId,
        },
      );

      if (!response.data?.playerstats) {
        console.error('Invalid response structure from GetUserStatsForGame');
        return null;
      }

      return response.data.playerstats;
    } catch (error) {
      console.error(`Error fetching stats for ${steamId} in game ${appId}:`, error);
      throw error;
    }
  }

  async getGameSchema(appId: number): Promise<unknown> {
    try {
      const response = await this.makeTrackedApiCall<GetSchemaForGameResponse>(
        SteamApiService.STEAM_ENDPOINTS.GET_SCHEMA_FOR_GAME,
        {
          key: this.apiKey,
          appid: appId,
        },
      );

      if (!response.data?.game) {
        console.error('Invalid response structure from GetSchemaForGame');
        return null;
      }

      return response.data.game;
    } catch (error) {
      console.error(`Error fetching schema for game ${appId}:`, error);
      throw error;
    }
  }

  getRateLimitInfo(): RateLimitInfo {
    return this.rateLimiter.getRateLimitInfo();
  }
}
