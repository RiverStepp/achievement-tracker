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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const steamScraper_1 = require("./services/steamScraper");
const configLoader_1 = require("./config/configLoader");
const axios_1 = __importDefault(require("axios"));
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
    let steamApiKey;
    try {
        steamApiKey = await (0, configLoader_1.loadSteamApiKey)();
    }
    catch (error) {
        console.error('Error loading Steam API key:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
    const trackingApiUrl = process.env.TRACKING_API_URL;
    if (!isInvokedThroughApi) {
        // Direct mode: Call Steam API directly (IsInvokedThroughApi=0)
        console.log('Running in DIRECT mode - calling Steam API directly\n');
        const config = {
            steamApiKey,
            maxConcurrentRequests: 1,
            requestDelay: 1000, // 1 second delay for rate limiting
            maxRetries: 3,
            outputFile: './data/steam_achievements.json'
        };
        const scraper = new steamScraper_1.SteamScraper(config, trackingApiUrl, false);
        try {
            const result = await scraper.scrapeUser(steamIdOrUsername);
            if (result.kind === 'success') {
                console.log(`\nUser: ${result.username} (${result.steamId})`);
                console.log(`Found ${result.gameStats.length} games with data`);
                process.exit(0);
            }
            if (result.kind === 'private_profile') {
                console.log(`\nUser ${result.steamId} profile is private`);
                process.exit(2);
            }
            if (result.kind === 'not_found') {
                console.log(`\nUser ${steamIdOrUsername} not found`);
                process.exit(1);
            }
            if (result.kind === 'cancelled') {
                console.log(`\nScrape cancelled`);
                process.exit(3);
            }
            console.error(`\nError scraping user: ${result.message}`);
            process.exit(1);
        }
        catch (error) {
            console.error(`\nError scraping user:`, error);
            process.exit(1);
        }
    }
    else {
        // API mode: Call backend API endpoint first (IsInvokedThroughApi=1)
        console.log('Running in API mode - calling backend API endpoint\n');
        const apiUrl = process.env.API_URL || 'https://localhost:7111';
        const endpoint = `${apiUrl}/api/scraper/scrape`;
        try {
            const response = await axios_1.default.post(endpoint, {
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
            }
            else {
                console.error(`\nScraping failed: ${response.data.error || 'Unknown error'}`);
                process.exit(1);
            }
        }
        catch (error) {
            if (error.response) {
                console.error(`\nAPI Error: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`);
                if (error.response.data?.message) {
                    console.error(`Message: ${error.response.data.message}`);
                }
            }
            else if (error.request) {
                console.error(`\nAPI Error: No response from server. Is the API running at ${apiUrl}?`);
            }
            else {
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
