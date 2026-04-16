import * as dotenv from 'dotenv';
import { SteamScraper } from './services/steamScraper';
import { DataStorage } from './utils/dataStorage';
import { ScrapingConfig } from './types';
import { ScraperApiService } from './services/scraperApi';
import { loadSteamApiKey } from './config/configLoader';

// Load environment variables
dotenv.config();

async function main() {
  console.log('Steam Achievement Scraper Starting...\n');

  // Load Steam API key: Key Vault -> Environment variables
  let steamApiKey: string;
  try {
    steamApiKey = await loadSteamApiKey();
  } catch (error) {
    console.error('Error loading Steam API key:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  // Configuration
  const config: ScrapingConfig = {
    steamApiKey,
    maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '1'),
    requestDelay: parseInt(process.env.REQUEST_DELAY || '2000'),
    maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
    outputFile: process.env.OUTPUT_FILE || './data/steam_achievements.json',
    resumeFrom: process.env.RESUME_FROM
  };

  // Get tracking API URL if configured
  const trackingApiUrl = process.env.TRACKING_API_URL;

  // Initialize services
  const scraper = new SteamScraper(config, trackingApiUrl);
  const dataStorage = new DataStorage('./data');

  // Example Steam IDs to scrape (replace with actual IDs)
  const steamIds = [
    '76561198046029799', // Example Steam ID (My ID)
    // Add more Steam IDs here
  ];

  // If no Steam IDs provided via environment, use example
  const userIds = process.env.STEAM_IDS 
    ? process.env.STEAM_IDS.split(',')
    : steamIds;

  console.log(`Configuration:`);
  console.log(`   API Key: ${steamApiKey.substring(0, 8)}...`);
  console.log(`   Max Concurrent: ${config.maxConcurrentRequests}`);
  console.log(`   Request Delay: ${config.requestDelay}ms`);
  console.log(`   Output File: ${config.outputFile}`);
  console.log(`   Users to scrape: ${userIds.length}\n`);

  try {
    // Start scraping
    const result = await scraper.scrapeMultipleProfiles(userIds);

    // Display results summary
    console.log('\n=== Scraping Results ===');
    console.log(`Total profiles: ${result.totalProfiles}`);
    console.log(`Successful: ${result.successCount}`);
    console.log(`Failed: ${result.failureCount}`);
    console.log(`Not found: ${result.notFoundCount}`);
    console.log(`Private: ${result.privateCount}`);
    console.log(`Cancelled: ${result.cancelledCount}`);

    // Show failed profiles if any
    if (result.failureCount > 0) {
      console.log('\nFailed profiles:');
      result.profiles
        .filter(p => p.result.kind === 'error')
        .forEach(p => {
          const errorResult = p.result as Extract<typeof p.result, { kind: 'error' }>;
          console.log(`  - ${p.steamId}: ${errorResult.error}`);
        });
    }

    // Cleanup old files
    dataStorage.cleanupOldFiles(7);

    console.log('\nScraping completed!');

  } catch (error) {
    console.error('\nScraping failed:', error);
    process.exit(1);
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

export { SteamScraper, DataStorage, ScraperApiService };
export { PointsService } from './services/pointsService';
