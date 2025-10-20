import { SteamApiService } from './steamApiService';
import { SteamUser, SteamGame, SteamGameStats, ScrapingProgress, ScrapingConfig } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class SteamScraper {
  private steamApi: SteamApiService;
  private config: ScrapingConfig;
  private progress: ScrapingProgress;
  private outputData: any[] = [];

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

  async scrapeUser(steamId: string): Promise<SteamGameStats[]> {
    console.log(`\nScraping user: ${steamId}`);
    this.progress.currentUser = steamId;

    try {
      // Get user profile
      const userProfile = await this.steamApi.getUserProfile(steamId);
      if (!userProfile) {
        console.log(`User ${steamId} not found or profile is private`);
        return [];
      }

      console.log(`Found user: ${userProfile.personaname}`);

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

      console.log(`Completed scraping for ${steamId}. Found ${gameStats.length} games with data.`);
      return gameStats;

    } catch (error) {
      console.error(`Error scraping user ${steamId}:`, error);
      this.progress.errors++;
      return [];
    }
  }

  async scrapeMultipleUsers(steamIds: string[]): Promise<void> {
    this.progress.totalUsers = steamIds.length;
    console.log(`Starting to scrape ${steamIds.length} users`);

    for (const steamId of steamIds) {
      try {
        const userGameStats = await this.scrapeUser(steamId);
        this.outputData.push({
          steamId,
          timestamp: new Date().toISOString(),
          gameStats: userGameStats
        });

        this.progress.completedUsers++;
        this.printProgress();

        // Save progress periodically
        if (this.progress.completedUsers % 10 === 0) {
          await this.saveProgress();
        }

        // Add delay between users
        await this.sleep(this.config.requestDelay);

      } catch (error) {
        console.error(`Failed to scrape user ${steamId}:`, error);
        this.progress.errors++;
      }
    }

    // Final save
    await this.saveProgress();
    console.log(`\n🎉 Scraping completed!`);
    this.printFinalStats();
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
    console.log(`Data saved to: ${this.config.outputFile}`);
  }

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

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getProgress(): ScrapingProgress {
    return { ...this.progress };
  }
}