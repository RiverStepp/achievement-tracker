import { SteamScraper } from './steamScraper';
import { SteamApiService } from './steamApiService';
import type { ScrapingConfig } from '../types';
import type { ScrapeUserInput, ScrapeUserResult, ScrapeUsersResult, SteamId64 } from './scraperApiTypes';

function normalizeUsername(username: string): string {
  if (typeof username !== 'string') throw new Error('username must be a string');
  const u = username.trim();
  if (!u) throw new Error('username must be non-empty');
  return u;
}

function parseSteamId64(input: string | bigint): SteamId64 {
  if (typeof input === 'bigint') {
    if (input <= 0n) throw new Error('steamId must be positive');
    return input;
  }
  const s = input.trim();
  if (!/^\d{10,20}$/.test(s)) throw new Error('steamId must be a numeric 64-bit string');
  const id = BigInt(s);
  if (id <= 0n) throw new Error('steamId must be positive');
  return id;
}

export class ScraperApiService {
  private scraper: SteamScraper;
  private steamApi: SteamApiService;

  constructor(
    steamApiKey: string,
    trackingApiUrl?: string,
    options?: Partial<
      Pick<
        ScrapingConfig,
        | 'maxConcurrentRequests'
        | 'achievementConcurrency'
        | 'forceFullAchievementSync'
        | 'scrapeProgressLog'
        | 'requestDelay'
        | 'maxRetries'
        | 'outputFile'
        | 'writeOutputFile'
        | 'saveToDatabase'
      >
    >,
  ) {
    const config: ScrapingConfig = {
      steamApiKey,
      maxConcurrentRequests: options?.maxConcurrentRequests ?? 1,
      achievementConcurrency: options?.achievementConcurrency ?? 1,
      forceFullAchievementSync: options?.forceFullAchievementSync ?? false,
      scrapeProgressLog: options?.scrapeProgressLog ?? false,
      requestDelay: options?.requestDelay ?? 2000,
      maxRetries: options?.maxRetries ?? 3,
      outputFile: options?.outputFile,
      writeOutputFile: options?.writeOutputFile ?? false,
      saveToDatabase: options?.saveToDatabase ?? true
    };
    this.scraper = new SteamScraper(config, trackingApiUrl, true);
    this.steamApi = new SteamApiService(steamApiKey, trackingApiUrl, true);
  }

  cancel(): void {
    this.scraper.cancel();
  }

  async scrapeUserByUsername(username: string): Promise<ScrapeUserResult> {
    const input: ScrapeUserInput = { kind: 'username', username: normalizeUsername(username) };
    return this.scrapeUser(input);
  }

  async scrapeUserBySteamId(steamId: string | bigint): Promise<ScrapeUserResult> {
    const id = parseSteamId64(steamId);
    const input: ScrapeUserInput = { kind: 'steamId', steamId: id };
    return this.scrapeUser(input);
  }

  async scrapeUser(input: ScrapeUserInput): Promise<ScrapeUserResult> {
    try {
      // Resolve username to Steam ID if needed
      let steamId: string;
      if (input.kind === 'username') {
        const resolvedId = await this.steamApi.resolveUsername(input.username);
        if (!resolvedId) {
          return { kind: 'not_found', input };
        }
        steamId = resolvedId;
      } else {
        steamId = input.steamId.toString();
      }

      // Scrape the profile
      const result = await this.scraper.scrapeProfile(steamId);

      // Map scraper result to API result
      switch (result.kind) {
        case 'success':
          return {
            kind: 'success',
            steamId: result.steamId,
            username: result.displayName,
            gameStatsCount: result.gamesProcessed
          };
        case 'not_found':
          return { kind: 'not_found', input };
        case 'private':
          return { kind: 'private_profile', steamId: result.steamId, input };
        case 'cancelled':
          return { kind: 'cancelled' };
        case 'error':
          return {
            kind: 'error',
            input,
            message: result.error,
            errorType: result.errorType,
            stack: result.stack
          };
      }
    } catch (error) {
      return {
        kind: 'error',
        input,
        message: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.name : undefined,
        stack: error instanceof Error ? error.stack : undefined
      };
    }
  }

  async scrapeUsers(inputs: ScrapeUserInput[]): Promise<ScrapeUsersResult> {
    // Errors are caught per-item and returned as kind:'error' results, not thrown.
    const results: ScrapeUserResult[] = [];
    for (const input of inputs) {
      results.push(await this.scrapeUser(input));
    }
    return { kind: 'batch_result', results };
  }

  getProgress() {
    return this.scraper.getProgress();
  }
}
