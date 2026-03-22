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
  gamesQueuedForAchievements: number;
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

  private progressLog(...parts: unknown[]): void {
    if (this.config.scrapeProgressLog === false) {
      return;
    }
    console.log(...parts);
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
      const { user: userProfile } = await this.steamApi.getUserProfile(steamId);
      if (!userProfile) {
        return { kind: 'not_found', steamId };
      }

      // Check if profile is private (personaname would still be available, but games might not)
      const ownedResult = await this.steamApi.getUserGames(steamId);
      const games = ownedResult.games;
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
      const profileSteamId = await this.saveProfileToDatabase(profileData);

      // Save owned games with playtime
      await this.saveOwnedGames(profileSteamId, games);

      // Process game achievements in batches
      const batchResult = await this.processGameAchievements(
        profileSteamId,
        steamId,
        games,
        isIncrementalUpdate,
      );

      this.progress.achievementsFound += batchResult.achievementsSaved;

      return {
        kind: 'success',
        steamId,
        displayName: profileData.displayName,
        gamesProcessed: batchResult.successCount,
        achievementsSaved: batchResult.achievementsSaved,
        gamesWithErrors: batchResult.errors,
        isIncrementalUpdate,
        totalOwnedGames: games.length,
        gamesQueuedForAchievements: batchResult.gamesQueuedForAchievements,
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

  // Save Steam profile to database (UserSteamProfiles.SteamId)
  private async saveProfileToDatabase(profile: ProfileData): Promise<bigint> {
    const dbService = await this.getDbService();

    return await dbService.upsertUser({
      steam_id: BigInt(profile.steamId),
      username: profile.displayName,
      profile_url: profile.profileUrl,
      avatar_url: profile.avatarUrl
    });
  }

  // Save owned games to database
  private async saveOwnedGames(profileSteamId: bigint, games: SteamGame[]): Promise<void> {
    const dbService = await this.getDbService();
    this.progressLog(`Saving ${games.length} owned game row(s) to database (playtime / ownership)...`);

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
          steam_id: profileSteamId,
          game_id: gameId,
          playtime_forever: game.playtime_forever ?? 0
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
    profileSteamId: bigint,
    steamId: string,
    games: SteamGame[],
    isIncrementalUpdate: boolean,
  ): Promise<GameBatchResult> {
    // Serial by default: parallel batches defeat the 1 req/s limiter and trigger Steam 403s.
    const batchSize = Math.max(1, this.config.achievementConcurrency ?? 1);
    let successCount = 0;
    let achievementsSaved = 0;
    const errors: GameProcessingError[] = [];

    let gamesToProcess = games;
    if (isIncrementalUpdate && !this.config.forceFullAchievementSync) {
      const recent = games.filter((g) => (g.playtime_2weeks ?? 0) > 0);
      if (recent.length > 0) {
        gamesToProcess = recent;
      }
    }

    this.progressLog(
      `Achievement sync: ${gamesToProcess.length} game(s) queued (of ${games.length} owned).`,
    );

    if (batchSize === 1) {
      for (let i = 0; i < gamesToProcess.length; i++) {
        if (this.cancellationToken.cancelled) {
          break;
        }
        const game = gamesToProcess[i];
        const title = game.name || (game.appid != null ? `App ${game.appid}` : 'Unknown game');
        this.progressLog(`[${i + 1}/${gamesToProcess.length}] ${title} (appid ${game.appid ?? '—'})`);
        const result = await this.processGameAchievement(profileSteamId, steamId, game);
        if (result.success) {
          successCount++;
          achievementsSaved += result.achievementsSaved;
          if (result.achievementsSaved > 0) {
            this.progressLog(`  → saved ${result.achievementsSaved} achievement(s)`);
          }
        } else if (result.error) {
          errors.push(result.error);
          this.progressLog(`  → error: ${result.error.error}`);
        }
      }
    } else {
      for (let i = 0; i < gamesToProcess.length; i += batchSize) {
        if (this.cancellationToken.cancelled) {
          break;
        }

        const batch = gamesToProcess.slice(i, i + batchSize);
        this.progressLog(
          `[Batch] apps ${batch.map((g) => g.appid).join(', ')} (${i + 1}–${Math.min(i + batchSize, gamesToProcess.length)} of ${gamesToProcess.length})`,
        );
        const batchPromises = batch.map((game) => this.processGameAchievement(profileSteamId, steamId, game));

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
    }

    return { successCount, achievementsSaved, errors, gamesQueuedForAchievements: gamesToProcess.length };
  }

  // Process achievements for a single game
  // Returns processing result
  private async processGameAchievement(
    profileSteamId: bigint,
    steamId: string,
    game: SteamGame
  ): Promise<{ success: boolean; achievementsSaved: number; error?: GameProcessingError }> {
    if (!game.appid) {
      return { success: false, achievementsSaved: 0 };
    }

    try {
      const apiResult = await this.retryApiCall(
        () => this.steamApi.getUserAchievements(steamId, game.appid!),
        3,
        1000,
      );

      const achievements = apiResult.achievements;

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

      // Collect all unlocked achievements for batch upsert
      const userAchievements: Array<{ steam_id: bigint; achievement_id: number; unlocked_at: Date }> = [];

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

        userAchievements.push({
          steam_id: profileSteamId,
          achievement_id: achievementId,
          unlocked_at: unlockedAt
        });
      }

      // Batch upsert all achievements for this game
      const saved = await dbService.batchUpsertUserAchievements(userAchievements);

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

  // Retry API calls with exponential backoff for transient failures
  private async retryApiCall<T>(
    apiCall: () => Promise<T>,
    maxRetries: number,
    initialDelayMs: number
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (this.cancellationToken.cancelled) {
        throw new Error('Operation cancelled');
      }

      try {
        return await apiCall();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on final attempt
        if (attempt === maxRetries) {
          break;
        }

        // Check if error is retryable (network/timeout errors, 429 rate limit, 5xx server errors)
        const isRetryable = this.isRetryableError(error);
        if (!isRetryable) {
          throw lastError;
        }

        // Exponential backoff with jitter
        const delayMs = initialDelayMs * Math.pow(2, attempt) + Math.random() * 500;
        await this.sleep(delayMs);
      }
    }

    throw lastError!;
  }

  // Check if an error is retryable
  private isRetryableError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) return false;
    const err = error as Record<string, unknown>;

    // Network errors
    const code = err['code'];
    if (code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'ENOTFOUND') {
      return true;
    }

    // HTTP status codes that are retryable (403 sometimes clears after backoff on Steam)
    const response = err['response'];
    const status = typeof response === 'object' && response !== null
      ? (response as Record<string, unknown>)['status']
      : undefined;
    if (status === 403 || status === 429 || status === 503 || status === 502 || status === 504) {
      return true;
    }

    return false;
  }

  // Sleep utility
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getProgress(): ScrapingProgress {
    return { ...this.progress };
  }

  // Get detailed scraping statistics
  getDetailedStats(): {
    progress: ScrapingProgress;
    rateLimitInfo: ReturnType<SteamApiService['getRateLimitInfo']>;
  } {
    return {
      progress: this.getProgress(),
      rateLimitInfo: this.steamApi.getRateLimitInfo()
    };
  }

  // Reset progress counters (useful for new batch operations)
  resetProgress(): void {
    this.progress = {
      totalUsers: 0,
      completedUsers: 0,
      currentUser: '',
      errors: 0,
      achievementsFound: 0
    };
  }

  // Cleanup resources to free memory
  async cleanup(): Promise<void> {
    this.dbService = null;
    this.resetProgress();
  }
}
