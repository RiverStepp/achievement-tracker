"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperApiService = exports.DataStorage = exports.SteamScraper = void 0;
const dotenv = __importStar(require("dotenv"));
const steamScraper_1 = require("./services/steamScraper");
Object.defineProperty(exports, "SteamScraper", { enumerable: true, get: function () { return steamScraper_1.SteamScraper; } });
const dataStorage_1 = require("./utils/dataStorage");
Object.defineProperty(exports, "DataStorage", { enumerable: true, get: function () { return dataStorage_1.DataStorage; } });
const scraperApi_1 = require("./services/scraperApi");
Object.defineProperty(exports, "ScraperApiService", { enumerable: true, get: function () { return scraperApi_1.ScraperApiService; } });
const configLoader_1 = require("./config/configLoader");
// Load environment variables
dotenv.config();
async function main() {
    console.log('Steam Achievement Scraper Starting...\n');
    // Load Steam API key: Key Vault -> Environment variables
    let steamApiKey;
    try {
        steamApiKey = await (0, configLoader_1.loadSteamApiKey)();
    }
    catch (error) {
        console.error('Error loading Steam API key:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
    // Configuration
    const config = {
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
    const scraper = new steamScraper_1.SteamScraper(config, trackingApiUrl);
    const dataStorage = new dataStorage_1.DataStorage('./data');
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
    }
    catch (error) {
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
