"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperApiService = void 0;
const steamScraper_1 = require("./steamScraper");
function normalizeUsername(username) {
    if (typeof username !== 'string')
        throw new Error('username must be a string');
    const u = username.trim();
    if (!u)
        throw new Error('username must be non-empty');
    return u;
}
function parseSteamId64(input) {
    if (typeof input === 'bigint') {
        if (input <= 0n)
            throw new Error('steamId must be positive');
        return input;
    }
    const s = input.trim();
    if (!/^\d{10,20}$/.test(s))
        throw new Error('steamId must be a numeric 64-bit string');
    const id = BigInt(s);
    if (id <= 0n)
        throw new Error('steamId must be positive');
    return id;
}
/**
 * API service for frontend integration
 * Handles scraping requests from frontend with username or Steam ID
 */
class ScraperApiService {
    constructor(steamApiKey, trackingApiUrl, options) {
        const config = {
            steamApiKey,
            maxConcurrentRequests: options?.maxConcurrentRequests ?? 1,
            requestDelay: options?.requestDelay ?? 2000,
            maxRetries: options?.maxRetries ?? 3,
            outputFile: options?.outputFile,
            writeOutputFile: options?.writeOutputFile ?? false,
            saveToDatabase: options?.saveToDatabase ?? true
        };
        this.scraper = new steamScraper_1.SteamScraper(config, trackingApiUrl);
    }
    cancel() {
        this.scraper.cancel();
    }
    async scrapeUserByUsername(username) {
        const input = { kind: 'username', username: normalizeUsername(username) };
        return this.scrapeUser(input);
    }
    async scrapeUserBySteamId(steamId) {
        const id = parseSteamId64(steamId);
        const input = { kind: 'steamId', steamId: id };
        return this.scrapeUser(input);
    }
    async scrapeUser(input) {
        const userKey = input.kind === 'username' ? input.username : input.steamId.toString();
        const result = await this.scraper.scrapeUser(userKey);
        switch (result.kind) {
            case 'success':
                return {
                    kind: 'success',
                    steamId: result.steamId,
                    username: result.username,
                    outputFile: result.outputFile,
                    gameStatsCount: result.gameStats.length
                };
            case 'not_found':
                return { kind: 'not_found', input };
            case 'private_profile':
                return { kind: 'private_profile', steamId: result.steamId, input };
            case 'cancelled':
                return { kind: 'cancelled' };
            case 'error':
                return {
                    kind: 'error',
                    input,
                    message: result.message,
                    errorType: result.errorType,
                    stack: result.stack
                };
        }
    }
    async scrapeUsers(inputs) {
        // Return per-item status; do NOT swallow errors.
        const results = [];
        for (const input of inputs) {
            results.push(await this.scrapeUser(input));
        }
        return { kind: 'batch_result', results };
    }
    /**
     * Get current scraping progress
     */
    getProgress() {
        return this.scraper.getProgress();
    }
}
exports.ScraperApiService = ScraperApiService;
