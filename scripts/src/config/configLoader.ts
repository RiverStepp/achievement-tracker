import { loadConfigFromKeyVault } from './keyVaultConfig';

/**
 * Load Steam API key with priority: Environment variables (.env) -> Key Vault
 */
export async function loadSteamApiKey(): Promise<string> {
    // First priority: Environment variable (from env or .env file)
    const steamApiKey = process.env.STEAM_API_KEY?.trim();
    if (steamApiKey) {
        return steamApiKey;
    }

    const keyVaultDisabled = process.env.DISABLE_KEY_VAULT === 'true';

    // Second priority: Load from Azure Key Vault if available
    const keyVaultUri = process.env.KEY_VAULT_URI || process.env.AZURE_KEY_VAULT_URI;
    if (!keyVaultDisabled && keyVaultUri) {
        try {
            console.log('Loading Steam API key from Azure Key Vault...');
            const keyVaultConfig = await loadConfigFromKeyVault();
            if (keyVaultConfig.steamApiKey) {
                console.log('Successfully loaded Steam API key from Key Vault');
                return keyVaultConfig.steamApiKey;
            }
        } catch (error) {
            console.warn('Failed to load Steam API key from Key Vault, trying environment variables:', error);
        }
    }

    if (!steamApiKey) {
        throw new Error(
            'Steam API key not found. Please provide one of:\n' +
            '  1. STEAM_API_KEY environment variable\n' +
            '  2. KEY_VAULT_URI environment variable (to load from Azure Key Vault)\n' +
            '  (These can be set in .env file or as environment variables)'
        );
    }

    return steamApiKey;
}
