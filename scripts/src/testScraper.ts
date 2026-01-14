import * as dotenv from 'dotenv';
import { SteamScraper } from './services/steamScraper';
import { ScrapingConfig } from './types';
import { getConnection, closeConnection } from './database/connection';
import { DatabaseService } from './database/models';

// Load environment variables
dotenv.config();

/**
 * Test script that scrapes a user and optionally removes test data
 * 
 * Usage:
 *   npm run test -- <steamIdOrUsername> [--cleanup]
 * 
 * Examples:
 *   npm run test -- 76561198046029799
 *   npm run test -- myusername
 *   npm run test -- 76561198046029799 --cleanup
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.error('Usage: npm run test -- <steamIdOrUsername> [--cleanup]');
        console.error('Example: npm run test -- 76561198046029799 --cleanup');
        process.exit(1);
    }

    const steamIdOrUsername = args[0];
    const shouldCleanup = args.includes('--cleanup');

    console.log('Steam Achievement Scraper Test\n');
    console.log(`Testing user: ${steamIdOrUsername}`);
    console.log(`Cleanup after test: ${shouldCleanup ? 'YES' : 'NO'}\n`);

    // Validate required environment variables
    const steamApiKey = process.env.STEAM_API_KEY;
    if (!steamApiKey) {
        console.error('STEAM_API_KEY environment variable is required');
        console.error('Please create a .env file with STEAM_API_KEY=your_key');
        process.exit(1);
    }

    // Configuration
    const config: ScrapingConfig = {
        steamApiKey,
        maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '1'),
        requestDelay: parseInt(process.env.REQUEST_DELAY || '2000'),
        maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
        outputFile: process.env.OUTPUT_FILE || './data/steam_achievements.json'
    };

    const scraper = new SteamScraper(config);
    let steamId: string | null = null;

    try {
        // Test database connection
        console.log('Testing database connection...');
        const pool = await getConnection();
        const dbService = new DatabaseService(pool);
        console.log('Database connection successful!\n');

        // Scrape the user
        console.log('Starting scrape...\n');
        const result = await scraper.scrapeUser(steamIdOrUsername);

        if (!result) {
            console.error('Failed to scrape user. User may not exist or profile may be private.');
            process.exit(1);
        }

        steamId = result.steamId;
        console.log(`\nScraping completed successfully.`);
        console.log(`  User: ${result.username} (${result.steamId})`);
        console.log(`  Games processed: ${result.gameStats.length}`);

        // Cleanup if requested
        if (shouldCleanup && steamId) {
            console.log('\n--- Cleanup Mode ---');
            console.log(`Removing test data for user ${steamId}...`);
            
            const deleted = await dbService.deleteUserBySteamId(parseInt(steamId, 10));
            
            if (deleted) {
                console.log(`Successfully removed test data for user ${steamId}`);
            } else {
                console.log(`User ${steamId} was not found in database (may have already been deleted)`);
            }
        } else if (shouldCleanup) {
            console.log('\nWarning: Could not cleanup - steam ID was not found');
        }

        console.log('\nTest completed successfully.');

    } catch (error) {
        console.error('\nTest failed:', error);
        process.exit(1);
    } finally {
        // Close database connection
        await closeConnection();
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT. Gracefully shutting down...');
    await closeConnection();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM. Gracefully shutting down...');
    await closeConnection();
    process.exit(0);
});

// Run the main function
if (require.main === module) {
    main().catch(async (error) => {
        console.error('Unhandled error:', error);
        await closeConnection();
        process.exit(1);
    });
}