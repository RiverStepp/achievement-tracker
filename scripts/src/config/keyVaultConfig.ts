import { initializeKeyVault, getSecret } from '../utils/keyVault';

/**
 * Load configuration from Azure Key Vault
 * Requires KEY_VAULT_URI environment variable
 */
export async function loadConfigFromKeyVault() {
    const keyVaultUri = process.env.KEY_VAULT_URI || process.env.AZURE_KEY_VAULT_URI;
    if (!keyVaultUri) {
        throw new Error('KEY_VAULT_URI environment variable is required. Set it to your Key Vault URI (e.g., https://your-vault.vault.azure.net/)');
    }

    console.log('Loading configuration from Azure Key Vault...');

    // Initialize Key Vault client
    initializeKeyVault(keyVaultUri);

    // Load secrets from Key Vault
    // Note: Secret names use double dashes (--) as separators in Key Vault (matching .NET configuration format)
    const steamApiKey = await getSecret('Authentication--Steam--ApiKey');
    const dbConnectionString = await getSecret('ConnectionStrings--DefaultConnection');

    console.log('Configuration loaded successfully from Key Vault');

    return {
        steamApiKey,
        dbConnectionString
    };
}
