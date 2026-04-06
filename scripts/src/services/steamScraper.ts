import { SteamApiService } from './steamApiService';
import { SteamStoreService } from './steamStoreService';
import { SteamGame, SteamAchievement, ScrapingProgress, ScrapingConfig } from '../types';
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

interface SchemaAchievement {
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  hidden: boolean;
}

interface GameBatchResult {
  successCount: number;
  achievementsSaved: number;
  errors: GameProcessingError[];
  gamesQueuedForAchievements: number;
}

export class SteamScraper {
  private steamApi: SteamApiService;
  private readonly steamStore = new SteamStoreService();
  private config: ScrapingConfig;
  private progress: ScrapingProgress;
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

      const result = await this.scrapeProfile(steamId);
      profiles.push({ steamId, result });

      switch (result.kind) {
        case 'success':    successCount++;    break;
        case 'error':      failureCount++;    break;
        case 'cancelled':  cancelledCount++;  break;
        case 'not_found':  notFoundCount++;   break;
        case 'private':    privateCount++;    break;
      }

      this.progress.completedUsers++;
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

  private async isIncrementalUpdate(steamId: string): Promise<boolean> {
    if (this.config.saveToDatabase === false) {
      return false;
    }

    try {
      const dbService = await this.getDbService();
      const lastUpdated = await dbService.getSteamProfileLastUpdated(BigInt(steamId));
      return lastUpdated !== null;
    } catch {
      // If we can't determine, treat as full scrape to be safe
      return false;
    }
  }

  // Save Steam profile to database (UserSteamProfiles.SteamId)
  private async saveProfileToDatabase(profile: ProfileData): Promise<bigint> {
    const dbService = await this.getDbService();

    return dbService.upsertUser({
      steam_id: BigInt(profile.steamId),
      username: profile.displayName,
      profile_url: profile.profileUrl,
      avatar_url: profile.avatarUrl
    });
  }

  private async saveOwnedGames(profileSteamId: bigint, games: SteamGame[]): Promise<void> {
    const dbService = await this.getDbService();
    this.progressLog(`Saving ${games.length} owned game row(s) to database (playtime / ownership)...`);

    for (const game of games) {
      if (!game.appid) {
        continue;
      }

      try {
        const { id: gameId, isNew } = await dbService.upsertGame({
          steam_appid: game.appid,
          name: game.name || `Steam App ${game.appid}`,
        });

        await dbService.upsertUserGame({
          steam_id: profileSteamId,
          game_id: gameId,
          playtime_forever: game.playtime_forever ?? 0,
        });

        // For brand-new games, enrich with Store API metadata (genres, publishers, etc.).
        // Skip on subsequent scrapes — COALESCE in upsertGame preserves existing data anyway.
        if (isNew) {
          const details = await this.steamStore.getAppDetails(game.appid);
          if (details) {
            await dbService.upsertGame({
              steam_appid: game.appid,
              name: details.name || game.name || `Steam App ${game.appid}`,
              short_description: details.short_description,
              header_image_url: details.header_image_url,
              release_date: details.release_date,
              genres: details.genres,
              categories: details.categories,
              platforms: details.platforms,
              developers: details.developers,
              publishers: details.publishers,
            });
          }
        }
      } catch (error) {
        console.error(`Failed to save game ${game.appid}:`, error instanceof Error ? error.message : String(error));
      }
    }
  }

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
        return { success: true, achievementsSaved: 0 };
      }

      // Get game ID from database
      const dbService = await this.getDbService();
      const gameId = await dbService.getGameIdBySteamAppId(game.appid);

      if (!gameId) {
        // Game missed the saveOwnedGames pass (transient DB error) — recover and continue.
        const storeDetails = await this.steamStore.getAppDetails(game.appid);
        const { id: recoveredId } = await dbService.upsertGame({
          steam_appid: game.appid,
          name: storeDetails?.name || game.name || `Steam App ${game.appid}`,
          short_description: storeDetails?.short_description,
          header_image_url: storeDetails?.header_image_url,
          release_date: storeDetails?.release_date,
          genres: storeDetails?.genres,
          categories: storeDetails?.categories,
          platforms: storeDetails?.platforms,
          developers: storeDetails?.developers,
          publishers: storeDetails?.publishers,
        });
        const recoveredMap = await this.seedAchievements(recoveredId, game.appid, achievements, dbService);
        return { success: true, achievementsSaved: await this.saveUserAchievementsFromMap(profileSteamId, achievements, recoveredMap) };
      }

      // Get all achievement IDs for this game in one query
      const achievementMap = await dbService.getAchievementMapForGame(gameId);

      if (achievementMap.size === 0) {
        const seededMap = await this.seedAchievements(gameId, game.appid, achievements, dbService);
        if (seededMap.size === 0) {
          return { success: true, achievementsSaved: 0 };
        }
        seededMap.forEach((v, k) => achievementMap.set(k, v));
      }

      // Seed any unlocked achievements still missing from the map (e.g., map was partially seeded
      // in a prior run and seeding was skipped this time because size > 0).
      const missingFromMap = achievements.filter((a) => a.achieved === 1 && !achievementMap.has(a.apiname));
      if (missingFromMap.length > 0) {
        for (const ach of missingFromMap) {
          if (!ach.apiname) continue;
          await dbService.upsertAchievement({
            game_id: gameId,
            steam_apiname: ach.apiname,
            name: ach.apiname,
            description_source: 'pending_enrichment',
          });
        }
        const rebuilt = await dbService.getAchievementMapForGame(gameId);
        rebuilt.forEach((v, k) => achievementMap.set(k, v));
      }

      const saved = await this.saveUserAchievementsFromMap(profileSteamId, achievements, achievementMap);
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

  // Converts a Steam achievement list + DB map into UserAchievement rows and batch-saves them.
  private async saveUserAchievementsFromMap(
    profileSteamId: bigint,
    achievements: SteamAchievement[],
    achievementMap: Map<string, number>,
  ): Promise<number> {
    const dbService = await this.getDbService();
    const unlocked = achievements.filter((a) => a.achieved === 1);
    const rows = unlocked.flatMap((a) => {
      const achievementId = achievementMap.get(a.apiname);
      if (!achievementId) return [];
      const unlocked_at = a.unlocktime > 0 ? new Date(a.unlocktime * 1000) : new Date();
      return [{ steam_id: profileSteamId, achievement_id: achievementId, unlocked_at }];
    });

    if (unlocked.length > 0 && rows.length < unlocked.length) {
      this.progressLog(
        `  [diag] unlocked=${unlocked.length}, db-mapped=${rows.length}, unmapped=${unlocked.length - rows.length} (missing from SteamAchievements)`,
      );
    }

    return dbService.batchUpsertUserAchievements(rows);
  }

  /** Parses the raw object returned by GetSchemaForGame into a flat achievement list. */
  private parseSchemaAchievements(schema: unknown): SchemaAchievement[] {
    if (schema == null || typeof schema !== 'object') return [];
    const stats = (schema as Record<string, unknown>)['availableGameStats'];
    if (stats == null || typeof stats !== 'object') return [];
    const raw = (stats as Record<string, unknown>)['achievements'];
    if (!Array.isArray(raw)) return [];
    const result: SchemaAchievement[] = [];
    for (const entry of raw) {
      if (typeof entry !== 'object' || entry == null) continue;
      const a = entry as Record<string, unknown>;
      const name = typeof a['name'] === 'string' ? a['name'] : null;
      if (!name) continue;
      result.push({
        name,
        displayName: typeof a['displayName'] === 'string' ? a['displayName'] : name,
        description: typeof a['description'] === 'string' ? a['description'] : undefined,
        icon: typeof a['icon'] === 'string' ? a['icon'] : undefined,
        hidden: a['hidden'] === 1,
      });
    }
    return result;
  }

  // Seeds missing achievements for a game using two fallback sources in order:
  //   1. Steam GetSchemaForGame — full data (name, description, icon, hidden flag)
  //   2. Player achievement API names — last resort; uses the Steam API names from
  //      GetPlayerAchievements as placeholders until a future enrichment pass
  // Returns the rebuilt achievement map (apiName → DB id) after seeding.
  private async seedAchievements(
    gameId: number,
    appId: number,
    playerAchievements: SteamAchievement[],
    dbService: DatabaseService,
  ): Promise<Map<string, number>> {
    // --- Source 1: Steam GetSchemaForGame ---
    try {
      const schema = await this.steamApi.getGameSchema(appId);
      const schemaAchs = this.parseSchemaAchievements(schema);
      if (schemaAchs.length > 0) {
        for (const ach of schemaAchs) {
          await dbService.upsertAchievement({
            game_id: gameId,
            steam_apiname: ach.name,
            name: ach.displayName,
            description: ach.description,
            icon_url: ach.icon,
            is_hidden: ach.hidden,
          });
        }
        this.progressLog(`  Seeded ${schemaAchs.length} achievement(s) from Steam schema for appId ${appId}`);
        return dbService.getAchievementMapForGame(gameId);
      }
    } catch (error) {
      console.error(`GetSchemaForGame failed for appId ${appId}:`, error instanceof Error ? error.message : String(error));
    }

    // --- Source 2: Player achievement API names (last resort) ---
    // We know the Steam API names from GetPlayerAchievements. Seed with those as placeholders
    // so the user's unlocks can be saved now. Display names can be enriched later.
    if (playerAchievements.length > 0) {
      let seeded = 0;
      for (const ach of playerAchievements) {
        if (!ach.apiname) continue;
        await dbService.upsertAchievement({
          game_id: gameId,
          steam_apiname: ach.apiname,
          name: ach.apiname,
          description_source: 'pending_enrichment',
        });
        seeded++;
      }
      if (seeded > 0) {
        this.progressLog(`  Seeded ${seeded} achievement(s) from player data (placeholders) for appId ${appId}`);
        return dbService.getAchievementMapForGame(gameId);
      }
    }

    return new Map();
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

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getProgress(): ScrapingProgress {
    return { ...this.progress };
  }

  getDetailedStats(): {
    progress: ScrapingProgress;
    rateLimitInfo: ReturnType<SteamApiService['getRateLimitInfo']>;
  } {
    return {
      progress: this.getProgress(),
      rateLimitInfo: this.steamApi.getRateLimitInfo()
    };
  }

  resetProgress(): void {
    this.progress = {
      totalUsers: 0,
      completedUsers: 0,
      currentUser: '',
      errors: 0,
      achievementsFound: 0
    };
  }

  async cleanup(): Promise<void> {
    this.dbService = null;
    this.resetProgress();
  }
}
