"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SteamApiService = void 0;
const axios_1 = __importDefault(require("axios"));
const rateLimiter_1 = require("../utils/rateLimiter");
class SteamApiService {
    constructor(apiKey, trackingApiUrl, isInvokedThroughApi = false) {
        this.baseUrl = 'https://api.steampowered.com';
        this.trackingApiUrl = null;
        this.cancellationToken = { cancelled: false };
        this.isInvokedThroughApi = false;
        this.apiKey = apiKey;
        this.rateLimiter = new rateLimiter_1.RateLimiter();
        this.trackingApiUrl = trackingApiUrl || process.env.TRACKING_API_URL || null;
        this.isInvokedThroughApi = isInvokedThroughApi;
        this.rateLimiter.setCancellationToken(this.cancellationToken);
    }
    setCancellationToken(token) {
        this.cancellationToken = token;
        this.rateLimiter.setCancellationToken(token);
    }
    /**
     * Make a tracked API call to Steam
     */
    async makeTrackedApiCall(endpoint, params) {
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
            const response = await axios_1.default.get(fullUrl, { params });
            const responseTime = Date.now() - startTime;
            // Record successful call
            await this.recordApiCall(endpoint, 'GET', response.status, responseTime, params);
            return response;
        }
        catch (error) {
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
    async recordApiCall(endpoint, method, statusCode, responseTimeMs, requestParams, errorMessage) {
        if (!this.trackingApiUrl) {
            // No tracking URL configured, skip silently
            return;
        }
        try {
            // Convert params to string dictionary (remove API key for security)
            const safeParams = {};
            if (requestParams) {
                for (const [key, value] of Object.entries(requestParams)) {
                    if (key !== 'key' && key !== 'steamApiKey') {
                        safeParams[key] = String(value);
                    }
                }
            }
            await axios_1.default.post(`${this.trackingApiUrl}/api/steam-api/record`, {
                endpoint,
                method,
                statusCode,
                responseTimeMs,
                requestParams: Object.keys(safeParams).length > 0 ? safeParams : undefined,
                errorMessage
            }, {
                timeout: 2000, // Don't wait too long for tracking
                validateStatus: () => true // Don't throw on tracking errors
            });
        }
        catch (error) {
            // Silently fail tracking - don't interrupt main flow
            console.debug('Failed to record API call:', error);
        }
    }
    /**
     * Resolves a Steam username/custom URL to Steam ID 64-bit
     * @param username Steam username or custom URL (e.g., "MyUsername" or "76561198046029799")
     * @returns Steam ID 64-bit string, or null if not found
     */
    async resolveUsername(username) {
        // If it's already a Steam ID (numeric), return it
        if (/^\d+$/.test(username)) {
            return username;
        }
        try {
            const response = await this.makeTrackedApiCall(SteamApiService.STEAM_ENDPOINTS.RESOLVE_VANITY_URL, {
                key: this.apiKey,
                vanityurl: username
            });
            if (response.data.response.success === 1) {
                return response.data.response.steamid || null;
            }
            return null;
        }
        catch (error) {
            console.error(`Error resolving username ${username}:`, error);
            throw error;
        }
    }
    async getUserProfile(steamId) {
        try {
            const response = await this.makeTrackedApiCall(SteamApiService.STEAM_ENDPOINTS.GET_PLAYER_SUMMARIES, {
                key: this.apiKey,
                steamids: steamId
            });
            if (response.data.response.players.length === 0) {
                return null;
            }
            return response.data.response.players[0];
        }
        catch (error) {
            console.error(`Error fetching user profile for ${steamId}:`, error);
            throw error;
        }
    }
    async getUserGames(steamId) {
        try {
            const response = await this.makeTrackedApiCall(SteamApiService.STEAM_ENDPOINTS.GET_OWNED_GAMES, {
                key: this.apiKey,
                steamid: steamId,
                include_appinfo: true,
                include_played_free_games: true
            });
            return response.data.response.games || [];
        }
        catch (error) {
            console.error(`Error fetching games for ${steamId}:`, error);
            throw error;
        }
    }
    async getUserAchievements(steamId, appId) {
        try {
            const response = await this.makeTrackedApiCall(SteamApiService.STEAM_ENDPOINTS.GET_PLAYER_ACHIEVEMENTS, {
                key: this.apiKey,
                steamid: steamId,
                appid: appId
            });
            return response.data.playerstats?.achievements || [];
        }
        catch (error) {
            console.error(`Error fetching achievements for ${steamId} in game ${appId}:`, error);
            throw error;
        }
    }
    async getUserStatsForGame(steamId, appId) {
        try {
            const response = await this.makeTrackedApiCall(SteamApiService.STEAM_ENDPOINTS.GET_USER_STATS_FOR_GAME, {
                key: this.apiKey,
                steamid: steamId,
                appid: appId
            });
            return response.data.playerstats;
        }
        catch (error) {
            console.error(`Error fetching stats for ${steamId} in game ${appId}:`, error);
            throw error;
        }
    }
    async getGameSchema(appId) {
        try {
            const response = await this.makeTrackedApiCall(SteamApiService.STEAM_ENDPOINTS.GET_SCHEMA_FOR_GAME, {
                key: this.apiKey,
                appid: appId
            });
            return response.data.game;
        }
        catch (error) {
            console.error(`Error fetching schema for game ${appId}:`, error);
            throw error;
        }
    }
    getRateLimitInfo() {
        return this.rateLimiter.getRateLimitInfo();
    }
}
exports.SteamApiService = SteamApiService;
/**
 * List of all Steam API endpoints we call
 */
SteamApiService.STEAM_ENDPOINTS = {
    RESOLVE_VANITY_URL: '/ISteamUser/ResolveVanityURL/v0001/',
    GET_PLAYER_SUMMARIES: '/ISteamUser/GetPlayerSummaries/v0002/',
    GET_OWNED_GAMES: '/IPlayerService/GetOwnedGames/v0001/',
    GET_PLAYER_ACHIEVEMENTS: '/ISteamUserStats/GetPlayerAchievements/v0001/',
    GET_USER_STATS_FOR_GAME: '/ISteamUserStats/GetUserStatsForGame/v0002/',
    GET_SCHEMA_FOR_GAME: '/ISteamUserStats/GetSchemaForGame/v0002/'
};
