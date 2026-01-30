import * as dotenv from 'dotenv';
import { SteamScraper } from './services/steamScraper';
import { SteamApiService } from './services/steamApiService';
import { ScrapingConfig } from './types';
import { loadSteamApiKey } from './config/configLoader';
import axios from 'axios';

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

    const config: ScrapingConfig = {
      steamApiKey,
      maxConcurrentRequests: 5,
      requestDelay: 1000, // 1 second delay for rate limiting
      maxRetries: 3,
      saveToDatabase: true
    };

    const scraper = new SteamScraper(config, trackingApiUrl, false);
    const steamApi = new SteamApiService(steamApiKey, trackingApiUrl, false);

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
        console.log(`Games processed: ${result.gamesProcessed}`);
        console.log(`Achievements saved: ${result.achievementsSaved}`);
        console.log(`Incremental update: ${result.isIncrementalUpdate ? 'Yes' : 'No (first time)'}`);

        if (result.gamesWithErrors.length > 0) {
          console.log(`\nGames with errors (${result.gamesWithErrors.length}):`);
          result.gamesWithErrors.slice(0, 5).forEach(err => {
            console.log(`  - ${err.gameName} (${err.appId}): ${err.error}`);
          });
          if (result.gamesWithErrors.length > 5) {
            console.log(`  ... and ${result.gamesWithErrors.length - 5} more`);
          }
        }

        process.exit(0);
      }

      if (result.kind === 'private') {
        console.log(`\nUser ${result.steamId} profile is private`);
        process.exit(2);
      }

      if (result.kind === 'not_found') {
        console.log(`\nUser ${result.steamId} not found`);
        process.exit(1);
      }

      if (result.kind === 'cancelled') {
        console.log(`\nScrape cancelled`);
        process.exit(3);
      }

      if (result.kind === 'error') {
        console.error(`\nError scraping user: ${result.error}`);
        if (result.errorType) {
          console.error(`Error type: ${result.errorType}`);
        }
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
        timeout: 300000 // 5 minute timeout for long-running scrapes
      });

      if (response.data.success) {
        console.log(`\nUser: ${response.data.username || steamIdOrUsername} (${response.data.steamId || steamIdOrUsername})`);
        console.log('Scraping completed successfully via API');
        process.exit(0);
      } else {
        console.error(`\nScraping failed: ${response.data.error || 'Unknown error'}`);
        process.exit(1);
      }
    } catch (error: any) {
      if (error.response) {
        console.error(`\nAPI Error: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`);
        if (error.response.data?.message) {
          console.error(`Message: ${error.response.data.message}`);
        }
      } else if (error.request) {
        console.error(`\nAPI Error: No response from server. Is the API running at ${apiUrl}?`);
      } else {
        console.error(`\nError: ${error.message}`);
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
