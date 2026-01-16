import * as dotenv from 'dotenv';
import { SteamScraper } from './services/steamScraper';
import { DataStorage } from './utils/dataStorage';
import { ScrapingConfig } from './types';
import { ScraperApiService } from './services/scraperApi';

// Load environment variables
dotenv.config();

async function main() {
  console.log('Steam Achievement Scraper Starting...\n');

  // Validate required environment variables
  const steamApiKey = process.env.STEAM_API_KEY;
  if (!steamApiKey) {
    console.error('STEAM_API_KEY environment variable is required');
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

  // Initialize services
  const scraper = new SteamScraper(config);
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
    await scraper.scrapeMultipleUsers(userIds);
    
    // Cleanup old files
    dataStorage.cleanupOldFiles(7);
    
    console.log('\nScraping completed successfully!'); 
    
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