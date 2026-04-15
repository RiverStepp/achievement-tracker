import sql from 'mssql';
import dotenv from 'dotenv';
import { loadConfigFromKeyVault } from '../config/keyVaultConfig';

dotenv.config();

interface PoolConfig {
    max?: number;
    min?: number;
    idleTimeoutMillis?: number;
}

// MSSQL configuration
// Priority: 1) Key Vault, 2) Environment variables (system env + .env file)
// NO hardcoded defaults - will throw error if not configured
let config: sql.config | null = null;
let pool: sql.ConnectionPool | null = null;

// Load configuration with proper priority order
async function loadConfig(): Promise<sql.config> {
    // First priority: DB_CONNECTION_STRING environment variable (from env or .env file)
    const connectionString = process.env.DB_CONNECTION_STRING?.trim();
    if (connectionString) {
        return sql.ConnectionPool.parseConnectionString(connectionString);
    }

    // Second priority: Individual environment variables (from env or .env file)
    // Use DB_USER consistently
    const user = process.env.DB_USER || process.env.DB_USERNAME;
    const password = process.env.DB_PASSWORD;
    const server = process.env.DB_SERVER || process.env.DB_HOST;
    const database = process.env.DB_NAME || process.env.DB_DATABASE;
    const portStr = process.env.DB_PORT;
    const encryptStr = process.env.DB_ENCRYPT;
    const trustCertStr = process.env.DB_TRUST_CERT;
    
    // Pool configuration from environment
    const poolMaxStr = process.env.DB_POOL_MAX;
    const poolMinStr = process.env.DB_POOL_MIN;
    const poolIdleTimeoutStr = process.env.DB_POOL_IDLE_TIMEOUT;
    const keyVaultDisabled = process.env.DISABLE_KEY_VAULT === 'true';

    if (server && database && user && password) {
        return buildSqlConfig({
            user,
            password,
            server,
            database,
            portStr,
            encryptStr,
            trustCertStr,
            poolMaxStr,
            poolMinStr,
            poolIdleTimeoutStr,
        });
    }

    // Third priority: Azure Key Vault, unless explicitly disabled
    const keyVaultUri = process.env.KEY_VAULT_URI || process.env.AZURE_KEY_VAULT_URI;
    if (!keyVaultDisabled && keyVaultUri) {
        try {
            console.log('Loading database connection string from Azure Key Vault...');
            const keyVaultConfig = await loadConfigFromKeyVault();
            if (keyVaultConfig.dbConnectionString) {
                console.log('Successfully loaded connection string from Key Vault');
                // Use the library's built-in parser
                return sql.ConnectionPool.parseConnectionString(keyVaultConfig.dbConnectionString);
            }
        } catch (error) {
            console.warn('Failed to load connection string from Key Vault, trying remaining environment variables:', error);
        }
    }

    // Validate required fields - throw error if missing
    if (!user) {
        throw new Error('DB_USER or DB_USERNAME environment variable is required');
    }
    if (!password) {
        throw new Error('DB_PASSWORD environment variable is required');
    }
    if (!server) {
        throw new Error('DB_SERVER or DB_HOST environment variable is required');
    }
    if (!database) {
        throw new Error('DB_NAME or DB_DATABASE environment variable is required');
    }

    return buildSqlConfig({
        user,
        password,
        server,
        database,
        portStr,
        encryptStr,
        trustCertStr,
        poolMaxStr,
        poolMinStr,
        poolIdleTimeoutStr,
    });
}

function buildSqlConfig({
    user,
    password,
    server,
    database,
    portStr,
    encryptStr,
    trustCertStr,
    poolMaxStr,
    poolMinStr,
    poolIdleTimeoutStr,
}: {
    user: string;
    password: string;
    server: string;
    database: string;
    portStr?: string;
    encryptStr?: string;
    trustCertStr?: string;
    poolMaxStr?: string;
    poolMinStr?: string;
    poolIdleTimeoutStr?: string;
}): sql.config {
    // Parse port using Number() and validate
    let port: number | undefined;
    if (portStr) {
        port = Number(portStr);
        if (isNaN(port) || port <= 0 || port > 65535) {
            throw new Error(`Invalid DB_PORT value: ${portStr}. Must be a number between 1 and 65535.`);
        }
    }

    // Parse encrypt (default to false if not specified)
    const encrypt = encryptStr === 'true';

    // Parse trustServerCertificate (default to false, must explicitly enable)
    const trustServerCertificate = trustCertStr === 'true';

    // Parse pool configuration
    const poolConfig: PoolConfig = {};
    if (poolMaxStr) {
        const max = Number(poolMaxStr);
        if (isNaN(max) || max <= 0) {
            throw new Error(`Invalid DB_POOL_MAX value: ${poolMaxStr}. Must be a positive number.`);
        }
        poolConfig.max = max;
    }
    if (poolMinStr) {
        const min = Number(poolMinStr);
        if (isNaN(min) || min < 0) {
            throw new Error(`Invalid DB_POOL_MIN value: ${poolMinStr}. Must be a non-negative number.`);
        }
        poolConfig.min = min;
    }
    if (poolIdleTimeoutStr) {
        const idleTimeout = Number(poolIdleTimeoutStr);
        if (isNaN(idleTimeout) || idleTimeout < 0) {
            throw new Error(`Invalid DB_POOL_IDLE_TIMEOUT value: ${poolIdleTimeoutStr}. Must be a non-negative number.`);
        }
        poolConfig.idleTimeoutMillis = idleTimeout;
    }

    const sqlConfig: sql.config = {
        user,
        password,
        server,
        database,
        port: port || 1433,
        options: {
            encrypt,
            trustServerCertificate,
            enableArithAbort: true
        }
    };

    // Add pool config only if any values were provided
    if (Object.keys(poolConfig).length > 0) {
        sqlConfig.pool = poolConfig;
    }

    return sqlConfig;
}

export async function getConnection(): Promise<sql.ConnectionPool> {
    if (!pool) {
        // Load config with proper priority: Key Vault -> Env vars -> .env file
        if (!config) {
            config = await loadConfig();
        }
        
        try {
            const newPool = new sql.ConnectionPool(config);
            await newPool.connect();
            pool = newPool; // Only assign after successful connection
            console.log(`Connected to MSSQL database: ${config.database} on ${config.server}`);
        } catch (error) {
            // Reset pool on failure
            pool = null;
            config = null;
            console.error('Failed to connect to MSSQL:', error);
            throw error;
        }
    }
    return pool;
}

export async function closeConnection(): Promise<void> {
    if (pool) {
        try {
            await pool.close();
            pool = null;
            config = null;
            console.log('Database connection closed');
        } catch (error) {
            console.error('Error closing database connection:', error);
            throw error;
        }
    }
}

// Export sql for use in models
export { sql };
