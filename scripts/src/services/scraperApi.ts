import { SteamScraper } from './steamScraper';
import { ScrapingConfig } from '../types';

/**
 * API service for frontend integration
 * Handles scraping requests from frontend with username or Steam ID
 */
export class ScraperApiService {
  private scraper: SteamScraper;

  constructor(steamApiKey: string) {
    const config: ScrapingConfig = {
      steamApiKey,
      maxConcurrentRequests: 1,
      requestDelay: 2000,
      maxRetries: 3,
      outputFile: './data/steam_achievements.json'
    };
    this.scraper = new SteamScraper(config);
  }

  /**
   * Scrape a single user by username or Steam ID
   * @param usernameOrId Steam username or Steam ID 64-bit
   * @returns Scraping result with file path
   */
  async scrapeUser(usernameOrId: string): Promise<{
    success: boolean;
    steamId?: string;
    username?: string;
    outputFile?: string;
    error?: string;
  }> {
    try {
      const result = await this.scraper.scrapeUser(usernameOrId);
      
      if (!result) {
        return {
          success: false,
          error: 'User not found or profile is private'
        };
      }

      return {
        success: true,
        steamId: result.steamId,
        username: result.username,
        outputFile: result.outputFile
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Scrape multiple users
   * @param usernameOrIds Array of Steam usernames or Steam IDs
   * @returns Array of scraping results
   */
  async scrapeUsers(usernameOrIds: string[]): Promise<{
    success: boolean;
    results: Array<{
      steamId: string;
      username: string;
      outputFile: string;
    }>;
    errors: Array<{
      input: string;
      error: string;
    }>;
  }> {
    try {
      const results = await this.scraper.scrapeMultipleUsers(usernameOrIds);
      
      return {
        success: true,
        results,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        results: [],
        errors: [{
          input: usernameOrIds.join(', '),
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }]
      };
    }
  }

  /**
   * Get current scraping progress
   */
  getProgress() {
    return this.scraper.getProgress();
  }
}
