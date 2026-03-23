import * as dotenv from 'dotenv';
import { SteamScraper } from './services/steamScraper';
import { SteamApiService } from './services/steamApiService';
import { ScrapingConfig } from './types';
import { loadSteamApiKey } from './config/configLoader';
import { getConnection } from './database/connection';
import { DatabaseService } from './database/databaseService';
import axios from 'axios';
import https from 'https';

// Node rejects the ASP.NET dev HTTPS cert unless trusted; allow localhost HTTPS only.
function httpsAgentForLocalDev(apiUrl: string): https.Agent | undefined {
  try {
    const u = new URL(apiUrl);
    if (u.protocol === 'https:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) {
      return new https.Agent({ rejectUnauthorized: false });
    }
  } catch {
    // ignore invalid URL
  }
  return undefined;
}

// Load environment variables
dotenv.config();

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const steamIdOrUsername = args[0];
  
  // Parse IsInvokedThroughApi flag (1 = through API, 0 = direct to Steam)
  const isInvokedThroughApiArg = args.find(arg => arg.startsWith('IsInvokedThroughApi='));
  const isInvokedThroughApi = isInvokedThroughApiArg 
    ? parseInt(isInvokedThroughApiArg.split('=')[1]) === 1
    : false; // Default to direct mode if not specified

  if (!steamIdOrUsername) {
    console.error('Usage: ts-node testScraper.ts <steamIdOrUsername> [IsInvokedThroughApi=0|1]');
    console.error('  IsInvokedThroughApi=1: All requests go through API (API handles rate limiting)');
    console.error('  IsInvokedThroughApi=0: Goes directly to Steam (skips API, default)');
    console.error('  Env: STEAM_INCREMENTAL_ACHIEVEMENTS_ONLY=1 — only sync achievements for games played in last 2 weeks');
    console.error(
      '  Env: STEAM_API_MAX_PER_SECOND, STEAM_API_MAX_PER_MINUTE, STEAM_API_MAX_PER_DAY — direct-mode Steam throttling (defaults 4/s, 300/min, 100000/day)',
    );
    process.exit(1);
  }

  // Load Steam API key: Key Vault -> Environment variables
  let steamApiKey: string;
  try {
    steamApiKey = await loadSteamApiKey();
  } catch (error) {
    console.error('Error loading Steam API key:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  const trackingApiUrl = process.env.TRACKING_API_URL;

  if (!isInvokedThroughApi) {
    // Direct mode: Call Steam API directly (IsInvokedThroughApi=0)
    console.log('Running in DIRECT mode - calling Steam API directly\n');

    // Set by AchievementTracker.Api when it spawns this process (skip duplicate client rate limits).
    const invokedViaApiHost = process.env.STEAM_SCRAPER_INVOKED_THROUGH_API === '1';

    const config: ScrapingConfig = {
      steamApiKey,
      maxConcurrentRequests: 2,
      achievementConcurrency: 1,
      requestDelay: 1000,
      maxRetries: 3,
      saveToDatabase: true,
      // CLI test run: scan the whole library for achievements, not only "played in last 2 weeks"
      forceFullAchievementSync: process.env.STEAM_INCREMENTAL_ACHIEVEMENTS_ONLY === '1' ? false : true,
      scrapeProgressLog: !invokedViaApiHost,
    };

    const scraper = new SteamScraper(config, trackingApiUrl, invokedViaApiHost);
    const steamApi = new SteamApiService(steamApiKey, trackingApiUrl, invokedViaApiHost);

    try {
      // Resolve username to Steam ID
      console.log(`Resolving ${steamIdOrUsername}...`);
      const steamId = await steamApi.resolveUsername(steamIdOrUsername);
      if (!steamId) {
        console.log(`\nUser ${steamIdOrUsername} not found`);
        process.exit(1);
      }

      console.log(`Found Steam ID: ${steamId}\n`);

      // Scrape the profile
      const result = await scraper.scrapeProfile(steamId);

      if (result.kind === 'success') {
        console.log(`\nUser: ${result.displayName} (${result.steamId})`);
        console.log(`Owned games (Steam API): ${result.totalOwnedGames}`);
        console.log(
          `Achievement API calls queued: ${result.gamesQueuedForAchievements} of ${result.totalOwnedGames} owned`,
        );
        if (result.isIncrementalUpdate && !config.forceFullAchievementSync) {
          console.log('  → Only games with playtime in the last 2 weeks (you set STEAM_INCREMENTAL_ACHIEVEMENTS_ONLY=1).');
        } else if (result.isIncrementalUpdate && config.forceFullAchievementSync) {
          console.log(
            '  → Scanning all owned games (testScraper default). Set STEAM_INCREMENTAL_ACHIEVEMENTS_ONLY=1 for 2-week-only.',
          );
        }
        console.log(`Games finished achievement step without errors: ${result.gamesProcessed}`);
        console.log(`Achievements saved to DB: ${result.achievementsSaved}`);
        console.log(`Had synced this profile before: ${result.isIncrementalUpdate ? 'Yes' : 'No'}`);

        // Verify the data actually landed in the database
        try {
          const pool = await getConnection();
          const dbService = new DatabaseService(pool);
          const dbCount = await dbService.getUnlockedAchievementCount(BigInt(steamId));
          console.log(`[DB verify] SteamUserAchievements rows for this user: ${dbCount}`);
        } catch (dbErr) {
          console.warn(`[DB verify] Could not query row count:`, dbErr instanceof Error ? dbErr.message : String(dbErr));
        }

        if (result.gamesWithErrors.length > 0) {
          console.log(`\nGames with errors (${result.gamesWithErrors.length}) — showing up to 10:`);
          result.gamesWithErrors.slice(0, 10).forEach(err => {
            console.log(`  - ${err.gameName} (${err.appId}): ${err.error}`);
          });
          if (result.gamesWithErrors.length > 10) {
            console.log(`  ... and ${result.gamesWithErrors.length - 10} more`);
          }
        }

        process.exit(0);
      } else if (result.kind === 'error') {
        console.error(`\nError scraping user: ${result.error}`);
        if (result.errorType) console.error(`Error type: ${result.errorType}`);
        process.exit(1);
      } else if (result.kind === 'cancelled') {
        console.log('\nScraping was cancelled.');
        process.exit(1);
      } else {
        // not_found or private
        const reason = result.kind === 'not_found' ? 'not found' : 'has a private profile';
        console.log(`\nUser ${steamIdOrUsername} ${reason}`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`\nError scraping user:`, error);
      process.exit(1);
    }
  } else {
    // API mode: Call backend API endpoint first (IsInvokedThroughApi=1)
    console.log('Running in API mode - calling backend API endpoint\n');
    
    const apiUrl = process.env.API_URL || 'https://localhost:7111';
    const endpoint = `${apiUrl}/api/scraper/scrape`;
    
    try {
      const response = await axios.post(endpoint, {
        steamIdOrUsername: steamIdOrUsername,
        useDirectMode: false // Going through API, not direct
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 300000, // 5 minute timeout for long-running scrapes
        httpsAgent: httpsAgentForLocalDev(apiUrl)
      });

      if (response.data.success) {
        console.log(`\nUser: ${response.data.username || steamIdOrUsername} (${response.data.steamId || steamIdOrUsername})`);
        console.log('Scraping completed successfully via API');
        process.exit(0);
      } else {
        console.error(`\nScraping failed: ${response.data.error || 'Unknown error'}`);
        process.exit(1);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const detail = error.message ? ` (${error.message})` : '';
        if (error.response) {
          const data = error.response.data as Record<string, unknown> | undefined;
          console.error(`\nAPI Error: ${error.response.status} - ${data?.['error'] ?? error.response.statusText}`);
          if (data?.['message']) {
            console.error(`Message: ${data['message']}`);
          }
        } else if (error.request) {
          console.error(
            `\nAPI Error: No response from server at ${apiUrl}${detail}. Start the API (e.g. F5 in Visual Studio) and ensure HTTPS works (try: dotnet dev-certs https --trust).`,
          );
        } else {
          console.error(`\nError: ${error.message}`);
        }
      } else {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`\nError: ${message}`);
      }
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM. Gracefully shutting down...');
  process.exit(0);
});

// Run the main function
if (require.main === module) {
  main().catch(console.error);
}
