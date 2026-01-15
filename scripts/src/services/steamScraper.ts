import { SteamApiService } from './steamApiService';
import { SteamUser, SteamGame, SteamGameStats, ScrapingProgress, ScrapingConfig } from '../types';
import { getConnection } from '../database/connection';
import { DatabaseService } from '../database/models';
import * as fs from 'fs';
import * as path from 'path';

export class SteamScraper {
    private steamApi: SteamApiService;
    private config: ScrapingConfig;
    private progress: ScrapingProgress;
    private outputData: any[] = [];
    private dbService: DatabaseService | null = null;

    constructor(config: ScrapingConfig) {
        this.config = config;
        this.steamApi = new SteamApiService(config.steamApiKey);
        this.progress = {
            totalUsers: 0,
            completedUsers: 0,
            currentUser: '',
            errors: 0,
            achievementsFound: 0
        };
    }

    private async getDbService(): Promise<DatabaseService> {
        if (!this.dbService) {
            const pool = await getConnection();
            this.dbService = new DatabaseService(pool);
        }
        return this.dbService;
    }

    async scrapeUser(usernameOrId: string): Promise<{ steamId: string; username: string; gameStats: SteamGameStats[]; outputFile: string } | null> {
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

            // Process games in batches to avoid overwhelming the API
            const batchSize = 5;
            for (let i = 0; i < games.length; i += batchSize) {
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
            await this.saveUserToDatabase(steamId, userProfile, gameStats);

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

                    // Output data collection (commented out - only needed for file saving/debugging)
                    // this.outputData.push({
                    //   steamId: result.steamId,
                    //   username: result.username,
                    //   timestamp: new Date().toISOString(),
                    //   gameStats: result.gameStats
                    // });
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

        // Final save (commented out - uncomment for debugging)
        // await this.saveProgress();
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

    /** File saving method (commented out - uncomment for debugging)
    private async saveUserData(steamId: string, username: string, userProfile: SteamUser, gameStats: SteamGameStats[]): Promise<string> {
      try {
        const outputDir = path.join(path.dirname(this.config.outputFile), 'users');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
  
        // Sanitize username for filename (remove invalid characters)
        const safeUsername = username.replace(/[<>:"/\\|?*]/g, '_').trim() || steamId;
        const filename = `${safeUsername}_${steamId}.json`;
        const filepath = path.join(outputDir, filename);
  
        const output = {
          steamId,
          username,
          scrapedAt: new Date().toISOString(),
          summary: {
            totalGames: gameStats.length,
           totalAchievements: gameStats.reduce((sum, game) => sum + game.achievements.length, 0),
            completedGames: gameStats.filter(game => 
              game.achievements.length > 0 && 
              game.achievements.every(ach => ach.achieved === 1)
            ).length
         },
          gameStats
        };
  
        fs.writeFileSync(filepath, JSON.stringify(output, null, 2));
        console.log(`User data saved to ${filepath}`);
        return filepath;
      } catch (error) {
        console.error(`Error saving user data:`, error);
        throw error;
      }
    }
  */

    private async saveUserToDatabase(steamId: string, userProfile: SteamUser, gameStats: SteamGameStats[]): Promise<void> {
        try {
            const dbService = await this.getDbService();

            // Save user to database
            // Use steamId as string to preserve precision (Steam IDs can exceed Number.MAX_SAFE_INTEGER)
            const userId = await dbService.upsertUser({
                steam_id: steamId, // Keep as string to avoid precision loss
                username: userProfile.personaname || steamId,
                profile_url: userProfile.profileurl,
                avatar_url: userProfile.avatarfull || userProfile.avatar
            });
            console.log(`User saved to database with ID: ${userId}`);

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
                        const achievementId = await dbService.getAchievementIdBySteamApiname(gameId, achievement.apiname);
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
    /** Progress file saving method (commented out - uncomment for debugging)
     private async saveProgress(): Promise<void> {
       try {
         const outputDir = path.dirname(this.config.outputFile);
         if (!fs.existsSync(outputDir)) {
           fs.mkdirSync(outputDir, { recursive: true });
         }
         const output = {
           metadata: {
             scrapedAt: new Date().toISOString(),
             totalUsers: this.progress.totalUsers,
             completedUsers: this.progress.completedUsers,
             achievementsFound: this.progress.achievementsFound,
             errors: this.progress.errors
             },
             data: this.outputData
           };
         fs.writeFileSync(this.config.outputFile, JSON.stringify(output, null, 2));
         console.log(`Progress saved to ${this.config.outputFile}`);
       } catch (error) {
         console.error(`Error saving progress:`, error);
       }
     }
    */

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getProgress(): ScrapingProgress {
        return { ...this.progress };
    }
}