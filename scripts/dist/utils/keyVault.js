"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeKeyVault = initializeKeyVault;
exports.getSecret = getSecret;
exports.getSecrets = getSecrets;
const identity_1 = require("@azure/identity");
const keyvault_secrets_1 = require("@azure/keyvault-secrets");
let secretClient = null;
let credentials = null;
/**
 * Initialize Azure Key Vault client
 * @param vaultUrl The URL of your Azure Key Vault (e.g., https://your-vault.vault.azure.net/)
 */
function initializeKeyVault(vaultUrl) {
    if (!secretClient) {
        credentials = new identity_1.DefaultAzureCredential();
        secretClient = new keyvault_secrets_1.SecretClient(vaultUrl, credentials);
    }
    return secretClient;
}
/**
 * Get a secret from Azure Key Vault
 * @param secretName The name of the secret (e.g., "Authentication--Steam--ApiKey")
 * @returns The secret value
 */
async function getSecret(secretName) {
    if (!secretClient) {
        throw new Error('Key Vault client not initialized. Call initializeKeyVault() first.');
    }
    try {
        const secret = await secretClient.getSecret(secretName);
        if (!secret.value) {
            throw new Error(`Secret "${secretName}" not found or has no value`);
        }
        return secret.value;
    }
    catch (error) {
        console.error(`Error getting secret "${secretName}" from Key Vault:`, error);
        throw error;
    }
}
/**
 * Get multiple secrets from Azure Key Vault
 * @param secretNames Array of secret names
 * @returns Object with secret names as keys and values as values
 */
async function getSecrets(secretNames) {
    const secrets = {};
    const promises = secretNames.map(async (name) => {
        try {
            secrets[name] = await getSecret(name);
        }
        catch (error) {
            console.error(`Failed to get secret "${name}":`, error);
            throw error;
        }
    });
    await Promise.all(promises);
    return secrets;
}
