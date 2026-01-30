import { SteamApiService } from './steamApiService';
import { SteamUser, SteamGame, SteamGameStats, ScrapingProgress, ScrapingConfig } from '../types';
import { getConnection } from '../database/connection';
import { DatabaseService } from '../database/databaseService';
import {
  ScrapeProfileResult,
  ScrapeMultipleProfilesResult,
  ProfileScrapeSummary,
  GameProcessingError
} from './steamScraperTypes';

interface ProfileData {
  steamId: string;
  displayName: string;
  profileUrl?: string;
  avatarUrl?: string;
}

interface GameBatchResult {
  successCount: number;
  achievementsSaved: number;
  errors: GameProcessingError[];
}

export class SteamScraper {
  private steamApi: SteamApiService;
  private config: ScrapingConfig;
  private progress: ScrapingProgress;
  private dbService: DatabaseService | null = null;
  private cancellationToken: { cancelled: boolean } = { cancelled: false };
  private isInvokedThroughApi: boolean = false;

  constructor(config: ScrapingConfig, trackingApiUrl?: string, isInvokedThroughApi: boolean = false) {
    this.config = config;
    this.steamApi = new SteamApiService(config.steamApiKey, trackingApiUrl, isInvokedThroughApi);
    this.isInvokedThroughApi = isInvokedThroughApi;
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
  }

  private async getDbService(): Promise<DatabaseService> {
    if (!this.dbService) {
      const pool = await getConnection();
      this.dbService = new DatabaseService(pool);
    }
    return this.dbService;
  }

  // Scrape a single Steam profile
  // Returns result object with status and data
  async scrapeProfile(steamId: string): Promise<ScrapeProfileResult> {
    if (this.cancellationToken.cancelled) {
      return { kind: 'cancelled' };
    }

    this.progress.currentUser = steamId;

    try {
      // Get profile information
      const userProfile = await this.steamApi.getUserProfile(steamId);
      if (!userProfile) {
        return { kind: 'not_found', steamId };
      }

      // Check if profile is private (personaname would still be available, but games might not)
      const games = await this.steamApi.getUserGames(steamId);
      if (games.length === 0 && userProfile.communityvisibilitystate !== 3) {
        // Profile exists but is private or has no games
        return { kind: 'private', steamId };
      }

      const profileData: ProfileData = {
        steamId,
        displayName: userProfile.personaname || steamId,
        profileUrl: userProfile.profileurl,
        avatarUrl: userProfile.avatarfull || userProfile.avatar
      };

      // Check if this is an incremental update
      const isIncrementalUpdate = await this.isIncrementalUpdate(steamId);

      // Save profile to database
      const dbProfileId = await this.saveProfileToDatabase(profileData);

      // Save owned games with playtime
      await this.saveOwnedGames(dbProfileId, games);

      // Process game achievements in batches
      const batchResult = await this.processGameAchievements(dbProfileId, steamId, games, isIncrementalUpdate);

      this.progress.achievementsFound += batchResult.achievementsSaved;

      return {
        kind: 'success',
        steamId,
        displayName: profileData.displayName,
        gamesProcessed: batchResult.successCount,
        achievementsSaved: batchResult.achievementsSaved,
        gamesWithErrors: batchResult.errors,
        isIncrementalUpdate
      };

    } catch (error) {
      this.progress.errors++;
      return {
        kind: 'error',
        steamId,
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.name : undefined,
        stack: error instanceof Error ? error.stack : undefined
      };
    }
  }

  // Scrape multiple Steam profiles
  // Returns summary of all scrape operations
  async scrapeMultipleProfiles(steamIds: string[]): Promise<ScrapeMultipleProfilesResult> {
    this.progress.totalUsers = steamIds.length;

    const profiles: ProfileScrapeSummary[] = [];
    let successCount = 0;
    let failureCount = 0;
    let cancelledCount = 0;
    let notFoundCount = 0;
    let privateCount = 0;

    for (const steamId of steamIds) {
      if (this.cancellationToken.cancelled) {
        cancelledCount++;
        profiles.push({
          steamId,
          result: { kind: 'cancelled' }
        });
        continue;
      }

      try {
        const result = await this.scrapeProfile(steamId);

        profiles.push({ steamId, result });

        // Update counters
        switch (result.kind) {
          case 'success':
            successCount++;
            break;
          case 'error':
            failureCount++;
            break;
          case 'cancelled':
            cancelledCount++;
            break;
          case 'not_found':
            notFoundCount++;
            break;
          case 'private':
            privateCount++;
            break;
        }

        this.progress.completedUsers++;

      } catch (error) {
        // This shouldn't happen as scrapeProfile handles errors, but just in case
        failureCount++;
        this.progress.errors++;
        profiles.push({
          steamId,
          result: {
            kind: 'error',
            steamId,
            error: error instanceof Error ? error.message : String(error),
            errorType: error instanceof Error ? error.name : undefined,
            stack: error instanceof Error ? error.stack : undefined
          }
        });
        this.progress.completedUsers++;
      }
    }

    return {
      totalProfiles: steamIds.length,
      successCount,
      failureCount,
      cancelledCount,
      notFoundCount,
      privateCount,
      profiles
    };
  }

  // Determine if this is an incremental update or first-time scrape
  // Returns true if profile has been scraped before, false otherwise
  private async isIncrementalUpdate(steamId: string): Promise<boolean> {
    if (this.config.saveToDatabase === false) {
      return false;
    }

    try {
      const dbService = await this.getDbService();
      const lastUpdated = await dbService.getSteamProfileLastUpdated(BigInt(steamId));
      return lastUpdated !== null;
    } catch (error) {
      // If we can't determine, treat as full scrape to be safe
      return false;
    }
  }

  // Save Steam profile to database
  // Returns database user ID
  private async saveProfileToDatabase(profile: ProfileData): Promise<number> {
    const dbService = await this.getDbService();

    return await dbService.upsertUser({
      steam_id: BigInt(profile.steamId),
      username: profile.displayName,
      profile_url: profile.profileUrl,
      avatar_url: profile.avatarUrl
    });
  }

  // Save owned games to database
  private async saveOwnedGames(dbProfileId: number, games: SteamGame[]): Promise<void> {
    const dbService = await this.getDbService();

    for (const game of games) {
      if (!game.appid) {
        continue;
      }

      try {
        // Ensure game exists in database
        const gameId = await dbService.upsertGame({
          steam_appid: game.appid,
          name: game.name || `Steam App ${game.appid}`
        });

        // Save user's ownership and playtime
        await dbService.upsertUserGame({
          user_id: dbProfileId,
          game_id: gameId,
          playtime_forever: game.playtime_forever ?? 0,
          playtime_2weeks: game.playtime_2weeks ?? 0
        });
      } catch (error) {
        // Log but continue with other games
        console.error(`Failed to save game ${game.appid}:`, error instanceof Error ? error.message : String(error));
      }
    }
  }

  // Process game achievements in batches
  // Returns batch processing result
  private async processGameAchievements(
    dbProfileId: number,
    steamId: string,
    games: SteamGame[],
    isIncrementalUpdate: boolean
  ): Promise<GameBatchResult> {
    const batchSize = this.config.maxConcurrentRequests || 5;
    let successCount = 0;
    let achievementsSaved = 0;
    const errors: GameProcessingError[] = [];

    // For incremental updates, we could optimize by only checking recently played games
    // For now, we'll process all games but this is where optimization could happen

    for (let i = 0; i < games.length; i += batchSize) {
      if (this.cancellationToken.cancelled) {
        break;
      }

      const batch = games.slice(i, i + batchSize);
      const batchPromises = batch.map(game => this.processGameAchievement(dbProfileId, steamId, game));

      const batchResults = await Promise.all(batchPromises);

      for (const result of batchResults) {
        if (result.success) {
          successCount++;
          achievementsSaved += result.achievementsSaved;
        } else if (result.error) {
          errors.push(result.error);
        }
      }
    }

    return { successCount, achievementsSaved, errors };
  }

  // Process achievements for a single game
  // Returns processing result
  private async processGameAchievement(
    dbProfileId: number,
    steamId: string,
    game: SteamGame
  ): Promise<{ success: boolean; achievementsSaved: number; error?: GameProcessingError }> {
    if (!game.appid) {
      return { success: false, achievementsSaved: 0 };
    }

    try {
      // Get achievements from Steam API
      const achievements = await this.steamApi.getUserAchievements(steamId, game.appid);

      if (achievements.length === 0) {
        // Game has no achievements or user hasn't unlocked any
        return { success: true, achievementsSaved: 0 };
      }

      // Get game ID from database
      const dbService = await this.getDbService();
      const gameId = await dbService.getGameIdBySteamAppId(game.appid);

      if (!gameId) {
        return {
          success: false,
          achievementsSaved: 0,
          error: {
            appId: game.appid,
            gameName: game.name,
            error: 'Game not found in database'
          }
        };
      }

      // Get all achievement IDs for this game in one query
      const achievementMap = await dbService.getAchievementMapForGame(gameId);

      if (achievementMap.size === 0) {
        // No achievements defined in database for this game
        return {
          success: false,
          achievementsSaved: 0,
          error: {
            appId: game.appid,
            gameName: game.name,
            error: 'No achievements found in database for this game'
          }
        };
      }

      // Save unlocked achievements
      let saved = 0;
      for (const achievement of achievements) {
        if (achievement.achieved !== 1) {
          continue; // Only save unlocked achievements
        }

        const achievementId = achievementMap.get(achievement.apiname);
        if (!achievementId) {
          continue; // Achievement not in database
        }

        // Convert Unix timestamp to UTC Date
        // Steam returns Unix timestamp in seconds, JavaScript Date expects milliseconds
        const unlockedAt = achievement.unlocktime > 0
          ? new Date(achievement.unlocktime * 1000)
          : new Date(); // Use current time if timestamp is missing

        try {
          await dbService.upsertUserAchievement({
            user_id: dbProfileId,
            achievement_id: achievementId,
            unlocked_at: unlockedAt
          });
          saved++;
        } catch (error) {
          // Log but continue with other achievements
          console.error(
            `Failed to save achievement ${achievement.apiname} for game ${game.appid}:`,
            error instanceof Error ? error.message : String(error)
          );
        }
      }

      return { success: true, achievementsSaved: saved };

    } catch (error) {
      return {
        success: false,
        achievementsSaved: 0,
        error: {
          appId: game.appid,
          gameName: game.name,
          error: error instanceof Error ? error.message : String(error),
          errorType: error instanceof Error ? error.name : undefined
        }
      };
    }
  }

  getProgress(): ScrapingProgress {
    return { ...this.progress };
  }
}
