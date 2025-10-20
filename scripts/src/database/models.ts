import { Pool, PoolClient } from 'pg';
import { getConnection } from './connection';

// TypeScript interfaces for database models
export interface Game {
    id?: number;
    steam_appid: number;
    name: string;
    release_date?: Date;
    developer?: string;
    publisher?: string;
    genres?: any; // JSON object
    header_image_url?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface Achievement {
    id?: number;
    game_id: number;
    steam_apiname: string;
    name: string;
    description?: string;
    icon_url?: string;
    points?: number;
    is_hidden?: boolean;
    created_at?: Date;
}

export interface User {
    id?: number;
    steam_id: number;
    username: string;
    profile_url?: string;
    avatar_url?: string;
    created_at?: Date;
}

export interface UserAchievement {
    id?: number;
    user_id: number;
    achievement_id: number;
    unlocked_at?: Date;
    created_at?: Date;
}

export interface AchievementStats {
    achievement_id: number;
    global_percentage: number;
    updated_at?: Date;
}

// Database service class
export class DatabaseService {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    // Game operations
    async upsertGame(game: Game): Promise<number> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
                INSERT INTO games (steam_appid, name, release_date, developer, publisher, genres, header_image_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (steam_appid) 
                DO UPDATE SET 
                    name = EXCLUDED.name,
                    release_date = EXCLUDED.release_date,
                    developer = EXCLUDED.developer,
                    publisher = EXCLUDED.publisher,
                    genres = EXCLUDED.genres,
                    header_image_url = EXCLUDED.header_image_url,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING id
            `, [
                game.steam_appid,
                game.name,
                game.release_date,
                game.developer,
                game.publisher,
                game.genres ? JSON.stringify(game.genres) : null,
                game.header_image_url
            ]);
            return result.rows[0].id;
        } finally {
            client.release();
        }
    }

    // Achievement operations
    async upsertAchievement(achievement: Achievement): Promise<number> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
                INSERT INTO achievements (game_id, steam_apiname, name, description, icon_url, points, is_hidden)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (game_id, steam_apiname) 
                DO UPDATE SET 
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    icon_url = EXCLUDED.icon_url,
                    points = EXCLUDED.points,
                    is_hidden = EXCLUDED.is_hidden
                RETURNING id
            `, [
                achievement.game_id,
                achievement.steam_apiname,
                achievement.name,
                achievement.description,
                achievement.icon_url,
                achievement.points,
                achievement.is_hidden
            ]);
            return result.rows[0].id;
        } finally {
            client.release();
        }
    }

    // User operations
    async upsertUser(user: User): Promise<number> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
                INSERT INTO users (steam_id, username, profile_url, avatar_url)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (steam_id) 
                DO UPDATE SET 
                    username = EXCLUDED.username,
                    profile_url = EXCLUDED.profile_url,
                    avatar_url = EXCLUDED.avatar_url
                RETURNING id
            `, [
                user.steam_id,
                user.username,
                user.profile_url,
                user.avatar_url
            ]);
            return result.rows[0].id;
        } finally {
            client.release();
        }
    }

    // User achievement operations
    async upsertUserAchievement(userAchievement: UserAchievement): Promise<number> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
                INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id, achievement_id) 
                DO UPDATE SET unlocked_at = EXCLUDED.unlocked_at
                RETURNING id
            `, [
                userAchievement.user_id,
                userAchievement.achievement_id,
                userAchievement.unlocked_at
            ]);
            return result.rows[0].id;
        } finally {
            client.release();
        }
    }

    // Get game with achievements
    async getGameWithAchievements(steamAppId: number): Promise<any> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
                SELECT 
                    g.*,
                    a.id as achievement_id,
                    a.steam_apiname,
                    a.name as achievement_name,
                    a.description as achievement_description,
                    a.icon_url as achievement_icon,
                    a.points,
                    a.is_hidden
                FROM games g
                LEFT JOIN achievements a ON g.id = a.game_id
                WHERE g.steam_appid = $1
                ORDER BY a.points DESC, a.name
            `, [steamAppId]);
            return result.rows;
        } finally {
            client.release();
        }
    }

    // Get user achievements for a game
    async getUserGameAchievements(userId: number, gameId: number): Promise<any> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
                SELECT 
                    a.*,
                    ua.unlocked_at,
                    CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as is_unlocked,
                    CASE 
                        WHEN a.is_hidden = true AND (a.description IS NULL OR a.description = '') THEN 'Hidden Achievement'
                        WHEN a.is_hidden = true AND a.description LIKE 'Hidden Achievement%' THEN a.description
                        ELSE a.description
                    END as display_description
                FROM achievements a
                LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
                WHERE a.game_id = $2
                ORDER BY a.points DESC, a.name
            `, [userId, gameId]);
            return result.rows;
        } finally {
            client.release();
        }
    }

    // Get achievements for a game with enhanced hidden achievement handling
    async getGameAchievements(steamAppId: number): Promise<any> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
                SELECT 
                    a.*,
                    CASE 
                        WHEN a.is_hidden = true AND (a.description IS NULL OR a.description = '') THEN 'Hidden Achievement - ' || a.name
                        WHEN a.is_hidden = true AND a.description LIKE 'Hidden Achievement%' THEN a.description
                        ELSE a.description
                    END as display_description,
                    CASE 
                        WHEN a.is_hidden = true THEN '🔒 Hidden'
                        ELSE '✅ Visible'
                    END as visibility_status
                FROM achievements a
                JOIN games g ON a.game_id = g.id
                WHERE g.steam_appid = $1
                ORDER BY a.is_hidden ASC, a.points DESC, a.name
            `, [steamAppId]);
            return result.rows;
        } finally {
            client.release();
        }
    }
}