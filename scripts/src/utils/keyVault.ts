import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

let secretClient: SecretClient | null = null;
let credentials: DefaultAzureCredential | null = null;

/**
 * Initialize Azure Key Vault client
 * @param vaultUrl The URL of your Azure Key Vault (e.g., https://your-vault.vault.azure.net/)
 */
export function initializeKeyVault(vaultUrl: string): SecretClient {
    if (!secretClient) {
        credentials = new DefaultAzureCredential();
        secretClient = new SecretClient(vaultUrl, credentials);
    }
    return secretClient;
}

/**
 * Get a secret from Azure Key Vault
 * @param secretName The name of the secret (e.g., "Authentication--Steam--ApiKey")
 * @returns The secret value
 */
export async function getSecret(secretName: string): Promise<string> {
    if (!secretClient) {
        throw new Error('Key Vault client not initialized. Call initializeKeyVault() first.');
    }

    try {
        const secret = await secretClient.getSecret(secretName);
        if (!secret.value) {
            throw new Error(`Secret "${secretName}" not found or has no value`);
        }
        return secret.value;
    } catch (error) {
        console.error(`Error getting secret "${secretName}" from Key Vault:`, error);
        throw error;
    }
}

/**
 * Get multiple secrets from Azure Key Vault
 * @param secretNames Array of secret names
 * @returns Object with secret names as keys and values as values
 */
export async function getSecrets(secretNames: string[]): Promise<Record<string, string>> {
    const secrets: Record<string, string> = {};
    const promises = secretNames.map(async (name) => {
        try {
            secrets[name] = await getSecret(name);
        } catch (error) {
            console.error(`Failed to get secret "${name}":`, error);
            throw error;
        }
    });
    await Promise.all(promises);
    return secrets;
}
