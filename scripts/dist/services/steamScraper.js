"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SteamScraper = void 0;
const steamApiService_1 = require("./steamApiService");
const connection_1 = require("../database/connection");
const databaseService_1 = require("../database/databaseService");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class SteamScraper {
    constructor(config, trackingApiUrl, isInvokedThroughApi = false) {
        this.outputData = [];
        this.dbService = null;
        this.cancellationToken = { cancelled: false };
        this.config = config;
        this.steamApi = new steamApiService_1.SteamApiService(config.steamApiKey, trackingApiUrl, isInvokedThroughApi);
        this.progress = {
            totalUsers: 0,
            completedUsers: 0,
            currentUser: '',
            errors: 0,
            achievementsFound: 0
        };
        this.steamApi.setCancellationToken(this.cancellationToken);
    }
    cancel() {
        this.cancellationToken.cancelled = true;
        console.log('Scraping operation cancelled');
    }
    async getDbService() {
        if (!this.dbService) {
            const pool = await (0, connection_1.getConnection)();
            this.dbService = new databaseService_1.DatabaseService(pool);
        }
        return this.dbService;
    }
    async scrapeUser(usernameOrId) {
        if (this.cancellationToken.cancelled) {
            return { kind: 'cancelled' };
        }
        console.log(`\nScraping user: ${usernameOrId}`);
        this.progress.currentUser = usernameOrId;
        try {
            // Resolve username to Steam ID if needed
            const steamId = await this.steamApi.resolveUsername(usernameOrId);
            if (!steamId) {
                console.log(`User ${usernameOrId} not found`);
                return { kind: 'not_found' };
            }
            // Get user profile
            const userProfile = await this.steamApi.getUserProfile(steamId);
            if (!userProfile) {
                console.log(`User ${steamId} not found or profile is private`);
                return { kind: 'private_profile', steamId };
            }
            const username = userProfile.personaname || steamId;
            console.log(`Found user: ${username} (${steamId})`);
            // Get user's games
            const games = await this.steamApi.getUserGames(steamId);
            console.log(`Found ${games.length} games`);
            const gameStats = [];
            // Store games with playtime for saving to database
            const gamesWithPlaytime = games;
            // Process games in batches to avoid overwhelming the API
            const batchSize = 5;
            for (let i = 0; i < games.length; i += batchSize) {
                if (this.cancellationToken.cancelled) {
                    throw new Error('Operation cancelled');
                }
                const batch = games.slice(i, i + batchSize);
                const batchPromises = batch.map(async (game) => {
                    try {
                        console.log(`Processing game: ${game.name} (${game.appid})`);
                        // Get achievements for this game
                        const achievements = await this.steamApi.getUserAchievements(steamId, game.appid);
                        const stats = await this.steamApi.getUserStatsForGame(steamId, game.appid);
                        const gameStat = {
                            steamID: steamId,
                            gameName: game.name,
                            appid: game.appid,
                            achievements: achievements,
                            stats: stats
                        };
                        this.progress.achievementsFound += achievements.length;
                        return gameStat;
                    }
                    catch (error) {
                        console.log(`Error processing game ${game.name}: ${error instanceof Error ? error.message : String(error)}`);
                        this.progress.errors++;
                        return null;
                    }
                });
                const batchResults = await Promise.all(batchPromises);
                gameStats.push(...batchResults.filter(result => result !== null));
                // Add delay between batches
                if (i + batchSize < games.length) {
                    await this.sleep(this.config.requestDelay);
                }
            }
            console.log(`Completed scraping for ${username}. Found ${gameStats.length} games with data.`);
            // Save to DB (default true unless explicitly disabled)
            if (this.config.saveToDatabase !== false) {
                await this.saveUserToDatabase(steamId, userProfile, gameStats, gamesWithPlaytime);
            }
            // Optional JSON output
            let outputFile;
            if (this.config.writeOutputFile && this.config.outputFile) {
                outputFile = this.config.outputFile;
                await this.writeOutputFile(outputFile, {
                    steamId,
                    username,
                    gameStats
                });
            }
            return {
                kind: 'success',
                steamId,
                username,
                gameStats,
                outputFile
            };
        }
        catch (error) {
            console.error(`Error scraping user ${usernameOrId}:`, error);
            this.progress.errors++;
            return {
                kind: 'error',
                message: error instanceof Error ? error.message : String(error),
                errorType: error instanceof Error ? error.name : undefined,
                stack: error instanceof Error ? error.stack : undefined
            };
        }
    }
    async scrapeMultipleUsers(usernameOrIds) {
        this.progress.totalUsers = usernameOrIds.length;
        console.log(`Starting to scrape ${usernameOrIds.length} users`);
        const results = [];
        for (const usernameOrId of usernameOrIds) {
            try {
                const result = await this.scrapeUser(usernameOrId);
                if (result.kind === 'success') {
                    results.push({
                        steamId: result.steamId,
                        username: result.username,
                        outputFile: result.outputFile
                    });
                }
                this.progress.completedUsers++;
                this.printProgress();
                // Save progress periodically (commented out - uncomment for debugging)
                // if (this.progress.completedUsers % 10 === 0) {
                //   await this.saveProgress();
                // }
                // Add delay between users
                await this.sleep(this.config.requestDelay);
            }
            catch (error) {
                console.error(`Failed to scrape user ${usernameOrId}:`, error);
                this.progress.errors++;
            }
        }
        console.log(`\nScraping completed!`);
        this.printFinalStats();
        return results;
    }
    async writeOutputFile(outputFilePath, payload) {
        const dir = path.dirname(outputFilePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(outputFilePath, JSON.stringify(payload, null, 2), { encoding: 'utf8' });
    }
    printProgress() {
        const percentage = ((this.progress.completedUsers / this.progress.totalUsers) * 100).toFixed(1);
        const rateLimitInfo = this.steamApi.getRateLimitInfo();
        console.log(`\nProgress: ${this.progress.completedUsers}/${this.progress.totalUsers} (${percentage}%)`);
        console.log(`Achievements found: ${this.progress.achievementsFound}`);
        console.log(`Errors: ${this.progress.errors}`);
        console.log(`Rate limit: ${rateLimitInfo.currentRequests}/${rateLimitInfo.requestsPer10Seconds} (10s), ${rateLimitInfo.requestsPerDay}/${rateLimitInfo.requestsPerDay} (daily)`);
    }
    printFinalStats() {
        console.log(`\nFinal Statistics:`);
        console.log(`Users processed: ${this.progress.completedUsers}/${this.progress.totalUsers}`);
        console.log(`Total achievements found: ${this.progress.achievementsFound}`);
        console.log(`Total errors: ${this.progress.errors}`);
        console.log(`Data saved to database`);
    }
    async saveUserToDatabase(steamId, userProfile, gameStats, games) {
        try {
            const dbService = await this.getDbService();
            // Save user to database
            // Convert steamId to bigint to preserve precision (Steam IDs can exceed Number.MAX_SAFE_INTEGER)
            const userId = await dbService.upsertUser({
                steam_id: BigInt(steamId),
                username: userProfile.personaname || steamId,
                profile_url: userProfile.profileurl,
                avatar_url: userProfile.avatarfull || userProfile.avatar
            });
            console.log(`User saved to database with ID: ${userId}`);
            // Save user's owned games with playtime
            let gamesSaved = 0;
            for (const game of games) {
                if (!game.appid) {
                    continue;
                }
                // Ensure the game exists in our DB even if it has no achievements / hasn't been scraped yet.
                // This satisfies "owned games list should include games without achievements".
                const gameId = await dbService.upsertGame({
                    steam_appid: game.appid,
                    name: game.name || `Steam App ${game.appid}`
                });
                // Save user game with playtime
                await dbService.upsertUserGame({
                    user_id: userId,
                    game_id: gameId,
                    playtime_forever: game.playtime_forever ?? 0,
                    playtime_2weeks: game.playtime_2weeks ?? 0
                });
                gamesSaved++;
            }
            console.log(`Saved ${gamesSaved} user games with playtime to database`);
            // Save user achievements to database
            let achievementsSaved = 0;
            for (const gameStat of gameStats) {
                if (!gameStat.appid) {
                    console.log(`Skipping game ${gameStat.gameName} - no appid`);
                    continue;
                }
                // Get game ID from database
                const gameId = await dbService.getGameIdBySteamAppId(gameStat.appid);
                if (!gameId) {
                    console.log(`Game ${gameStat.gameName} (${gameStat.appid}) not found in database, skipping achievements`);
                    continue;
                }
                // Save each unlocked achievement
                for (const achievement of gameStat.achievements) {
                    if (achievement.achieved === 1) { // Only save unlocked achievements
                        const achievementId = await dbService.getAchievementIdBySteamApiName(gameId, achievement.apiname);
                        if (achievementId) {
                            // Convert unlocktime (Unix timestamp) to Date
                            const unlockedAt = achievement.unlocktime > 0
                                ? new Date(achievement.unlocktime * 1000)
                                : undefined;
                            await dbService.upsertUserAchievement({
                                user_id: userId,
                                achievement_id: achievementId,
                                unlocked_at: unlockedAt
                            });
                            achievementsSaved++;
                        }
                        else {
                            console.log(`Achievement ${achievement.apiname} not found in database for game ${gameStat.appid}`);
                        }
                    }
                }
            }
            console.log(`Saved ${achievementsSaved} user achievements to database`);
        }
        catch (error) {
            console.error(`Error saving user to database:`, error);
            // Don't throw - allow file saving to continue even if database save fails
        }
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    getProgress() {
        return { ...this.progress };
    }
}
exports.SteamScraper = SteamScraper;
