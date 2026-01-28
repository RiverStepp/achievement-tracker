import { SteamApiService } from './steamApiService';
import { SteamUser, SteamGame, SteamGameStats, ScrapingProgress, ScrapingConfig } from '../types';
import { getConnection } from '../database/connection';
import { DatabaseService } from '../database/models';

export class SteamScraper {
    private steamApi: SteamApiService;
    private config: ScrapingConfig; 
    private progress: ScrapingProgress;
    private outputData: any[] = [];
    private dbService: DatabaseService | null = null;
    private cancellationToken: { cancelled: boolean } = { cancelled: false };

    constructor(config: ScrapingConfig, trackingApiUrl?: string, isInvokedThroughApi: boolean = false) {
        this.config = config;
        this.steamApi = new SteamApiService(config.steamApiKey, trackingApiUrl, isInvokedThroughApi);
        this.progress = {
            totalUsers: 0,
            completedUsers: 0,
            currentUser: '',
            errors: 0,
            achievementsFound: 0
        };
        this.steamApi.setCancellationToken(this.cancellationToken);
    }

    cancel(): void {
        this.cancellationToken.cancelled = true;
        console.log('Scraping operation cancelled');
    }

    private async getDbService(): Promise<DatabaseService> {
        if (!this.dbService) {
            const pool = await getConnection();
            this.dbService = new DatabaseService(pool);
        }
        return this.dbService;
    }

    async scrapeUser(usernameOrId: string): Promise<{ steamId: string; username: string; gameStats: SteamGameStats[]; outputFile: string } | null> {
        if (this.cancellationToken.cancelled) {
            throw new Error('Operation cancelled');
        }

        console.log(`\nScraping user: ${usernameOrId}`);
        this.progress.currentUser = usernameOrId;

        try {
            // Resolve username to Steam ID if needed
            const steamId = await this.steamApi.resolveUsername(usernameOrId);
            if (!steamId) {
                console.log(`User ${usernameOrId} not found`);
                return null;
            }

            // Get user profile
            const userProfile = await this.steamApi.getUserProfile(steamId);
            if (!userProfile) {
                console.log(`User ${steamId} not found or profile is private`);
                return null;
            }

            const username = userProfile.personaname || steamId;
            console.log(`Found user: ${username} (${steamId})`);

            // Get user's games
            const games = await this.steamApi.getUserGames(steamId);
            console.log(`Found ${games.length} games`);

            const gameStats: SteamGameStats[] = [];
            
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

                        const gameStat: SteamGameStats = {
                            steamID: steamId,
                            gameName: game.name,
                            appid: game.appid,
                            achievements: achievements,
                            stats: stats
                        };

                        this.progress.achievementsFound += achievements.length;
                        return gameStat;
                    } catch (error) {
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

            // Save to database only (file saving commented out - uncomment for debugging)
            await this.saveUserToDatabase(steamId, userProfile, gameStats, gamesWithPlaytime);

            return {
                steamId,
                username,
                gameStats,
                outputFile: '' // File saving disabled - data saved to database only
            };

        } catch (error) {
            console.error(`Error scraping user ${usernameOrId}:`, error);
            this.progress.errors++;
            return null;
        }
    }

    async scrapeMultipleUsers(usernameOrIds: string[]): Promise<Array<{ steamId: string; username: string; outputFile: string }>> {
        this.progress.totalUsers = usernameOrIds.length;
        console.log(`Starting to scrape ${usernameOrIds.length} users`);

        const results: Array<{ steamId: string; username: string; outputFile: string }> = [];

        for (const usernameOrId of usernameOrIds) {
            try {
                const result = await this.scrapeUser(usernameOrId);
                if (result) {
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

            } catch (error) {
                console.error(`Failed to scrape user ${usernameOrId}:`, error);
                this.progress.errors++;
            }
        }

        console.log(`\nScraping completed!`);
        this.printFinalStats();

        return results;
    }

    private printProgress(): void {
        const percentage = ((this.progress.completedUsers / this.progress.totalUsers) * 100).toFixed(1);
        const rateLimitInfo = this.steamApi.getRateLimitInfo();

        console.log(`\nProgress: ${this.progress.completedUsers}/${this.progress.totalUsers} (${percentage}%)`);
        console.log(`Achievements found: ${this.progress.achievementsFound}`);
        console.log(`Errors: ${this.progress.errors}`);
        console.log(`Rate limit: ${rateLimitInfo.currentRequests}/${rateLimitInfo.requestsPer10Seconds} (10s), ${rateLimitInfo.requestsPerDay}/${rateLimitInfo.requestsPerDay} (daily)`);
    }

    private printFinalStats(): void {
        console.log(`\nFinal Statistics:`);
        console.log(`Users processed: ${this.progress.completedUsers}/${this.progress.totalUsers}`);
        console.log(`Total achievements found: ${this.progress.achievementsFound}`);
        console.log(`Total errors: ${this.progress.errors}`);
        console.log(`Data saved to database`);
    }

    private async saveUserToDatabase(steamId: string, userProfile: SteamUser, gameStats: SteamGameStats[], games: SteamGame[]): Promise<void> {
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

                // Get game ID from database
                const gameId = await dbService.getGameIdBySteamAppId(game.appid);
                if (!gameId) {
                    console.log(`Game ${game.name} (${game.appid}) not found in database, skipping`);
                    continue;
                }

                // Save user game with playtime
                await dbService.upsertUserGame({
                    user_id: userId,
                    game_id: gameId,
                    playtime_forever: game.playtime_forever || 0,
                    playtime_2weeks: game.playtime_2weeks || 0
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
                        } else {
                            console.log(`Achievement ${achievement.apiname} not found in database for game ${gameStat.appid}`);
                        }
                    }
                }
            }

            console.log(`Saved ${achievementsSaved} user achievements to database`);
        } catch (error) {
            console.error(`Error saving user to database:`, error);
            // Don't throw - allow file saving to continue even if database save fails
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getProgress(): ScrapingProgress {
        return { ...this.progress };
    }
}