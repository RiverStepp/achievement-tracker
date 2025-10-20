import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL configuration (optimized for Neon)
const config = {
    user: process.env.DB_USER || 'neondb_owner',
    password: process.env.DB_PASSWORD || 'npg_a4UOv3FMBKiH',
    host: process.env.DB_HOST || 'ep-fancy-star-a8e9y3m3-pooler.eastus2.azure.neon.tech',
    database: process.env.DB_NAME || 'neondb',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: { rejectUnauthorized: false }, // Required for Neon
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Longer timeout for cloud connections
};

let pool: Pool | null = null;

export async function getConnection(): Promise<Pool> {
    if (!pool) {
        try {
            pool = new Pool(config);
            console.log('✅ Connected to PostgreSQL database');
        } catch (error) {
            console.error('❌ Failed to connect to PostgreSQL:', error);
            throw error;
        }
    }
    return pool;
}

export async function closeConnection(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
        console.log('🔌 Database connection closed');
    }
}

// Test connection function
export async function testConnection(): Promise<boolean> {
    try {
        const pool = await getConnection();
        const client = await pool.connect();
        const result = await client.query('SELECT 1 as test');
        client.release();
        console.log('✅ Database connection test successful');
        return true;
    } catch (error) {
        console.error('❌ Database connection test failed:', error);
        return false;
    }
}