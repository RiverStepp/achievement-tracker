import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// Helper function to parse connection string format
// Supports: "Server=localhost;Database=db;User Id=user;Password=pass;"
function parseConnectionString(connectionString: string): sql.config {
    const config: any = {
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        }
    };

    const parts = connectionString.split(';');
    parts.forEach(part => {
        const [key, value] = part.split('=').map(s => s.trim());
        if (!key || !value) return;

        switch (key.toLowerCase()) {
            case 'server':
            case 'data source':
                config.server = value;
                break;
            case 'database':
            case 'initial catalog':
                config.database = value;
                break;
            case 'user id':
            case 'uid':
                config.user = value;
                break;
            case 'password':
            case 'pwd':
                config.password = value;
                break;
            case 'port':
                config.port = parseInt(value);
                break;
            case 'encrypt':
                config.options.encrypt = value.toLowerCase() === 'true';
                break;
            case 'trustservercertificate':
                config.options.trustServerCertificate = value.toLowerCase() === 'true';
                break;
        }
    });

    return config;
}

// MSSQL configuration
// Supports both individual env vars and connection string format
const config: sql.config = process.env.DB_CONNECTION_STRING 
    ? parseConnectionString(process.env.DB_CONNECTION_STRING)
    : {
        user: process.env.DB_USER || process.env.DB_USERNAME || 'sa',
        password: process.env.DB_PASSWORD || '',
        server: process.env.DB_SERVER || process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || process.env.DB_DATABASE || 'AchievementTracker',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 1433,
        options: {
            encrypt: process.env.DB_ENCRYPT === 'true', // Set to true if using Azure SQL
            trustServerCertificate: process.env.DB_TRUST_CERT !== 'false', // For local development
            enableArithAbort: true
        },
    pool: {
        max: 20, // Maximum number of connections in the pool
        min: 0, // Minimum number of connections in the pool
        idleTimeoutMillis: 30000 // Close idle connections after 30 seconds
    }
};

let pool: sql.ConnectionPool | null = null;

export async function getConnection(): Promise<sql.ConnectionPool> {
    if (!pool) {
        try {
            pool = new sql.ConnectionPool(config);
            await pool.connect();
            console.log('Connected to MSSQL database');
        } catch (error) {
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
            console.log('Database connection closed');
        } catch (error) {
            console.error('Error closing database connection:', error);
            throw error;
        }
    }
}

// Test connection function
export async function testConnection(): Promise<boolean> {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT 1 as test');
        console.log('Database connection test successful');
        return true;
    } catch (error) {
        console.error('Database connection test failed:', error);
        return false;
    }
}

// Export sql for use in models
export { sql };
