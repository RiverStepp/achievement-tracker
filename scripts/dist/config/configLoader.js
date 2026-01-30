"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSteamApiKey = loadSteamApiKey;
const keyVaultConfig_1 = require("./keyVaultConfig");
/**
 * Load Steam API key with priority: Key Vault -> Environment variables (.env)
 */
async function loadSteamApiKey() {
    // First priority: Load from Azure Key Vault if available
    const keyVaultUri = process.env.KEY_VAULT_URI || process.env.AZURE_KEY_VAULT_URI;
    if (keyVaultUri) {
        try {
            console.log('Loading Steam API key from Azure Key Vault...');
            const keyVaultConfig = await (0, keyVaultConfig_1.loadConfigFromKeyVault)();
            if (keyVaultConfig.steamApiKey) {
                console.log('Successfully loaded Steam API key from Key Vault');
                return keyVaultConfig.steamApiKey;
            }
        }
        catch (error) {
            console.warn('Failed to load Steam API key from Key Vault, trying environment variables:', error);
        }
    }
    // Second priority: Environment variable (from env or .env file)
    const steamApiKey = process.env.STEAM_API_KEY;
    if (!steamApiKey) {
        throw new Error('Steam API key not found. Please provide one of:\n' +
            '  1. KEY_VAULT_URI environment variable (to load from Azure Key Vault)\n' +
            '  2. STEAM_API_KEY environment variable\n' +
            '  (These can be set in .env file or as environment variables)');
    }
    return steamApiKey;
}
