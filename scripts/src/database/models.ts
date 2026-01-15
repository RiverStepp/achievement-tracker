import sql, { ConnectionPool } from 'mssql';
import { getConnection } from './connection';

// TypeScript interfaces for database models

// Lookup table interfaces
export interface Platform {
    id?: number;
    name: string;
}

export interface Genre {
    id?: number;
    name: string;
}

export interface Category {
    id?: number;
    name: string;
}

export interface Tag {
    id?: number;
    name: string;
}

export interface Language {
    id?: number;
    code: string; // ISO language code (e.g., 'en', 'fr', 'de')
    name: string; // Full language name (e.g., 'English', 'French', 'German')
}

export interface Developer {
    id?: number;
    name: string;
}

export interface Publisher {
    id?: number;
    name: string;
}

// Game language support interface
export interface GameLanguageSupport {
    code?: string; // ISO language code (e.g., 'en', 'fr', 'de')
    language_id?: number; // Alternative: direct language ID reference
    has_interface?: boolean;
    has_full_audio?: boolean;
    has_subtitles?: boolean;
}

// Main Game interface (refactored - removed JSON columns)
export interface Game {
    id?: number;
    steam_appid: number;
    name: string;
    release_date?: Date;
    developers?: string[]; // Array of developer names
    publishers?: string[]; // Array of publisher names
    header_image_url?: string;
    created_at?: Date;
    updated_at?: Date;
    price?: string;
    original_price?: string;
    discount_percent?: number;
    currency?: string;
    short_description?: string;
    metacritic_score?: number;
    recommendations?: number;
    is_unlisted?: boolean;
    is_removed?: boolean;
    main_story_hours?: number;
    main_sides_hours?: number;
    completionist_hours?: number;
    all_styles_hours?: number;
    alias?: string;
    score_rank?: number;
    min_owners?: number; // Minimum owner count
    max_owners?: number | null; // Maximum owner count (NULL if exact number)
    peak_ccu?: number;
    // Relationships (arrays of names/codes, will be resolved to IDs)
    platforms?: string[]; // Array of platform names
    genres?: string[]; // Array of genre names
    categories?: string[]; // Array of category names
    tags?: string[]; // Array of tag names
    languages?: GameLanguageSupport[] | string[]; // Array of language codes or objects with support info
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
    description_source?: string;
    last_updated?: Date;
}

export interface User {
    id?: number;
    steam_id: number | string | bigint;
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
    private pool: ConnectionPool;

    constructor(pool: ConnectionPool) {
        this.pool = pool;
    }

    // Helper method to parse owners string like "0 .. 20000" into min/max
    private parseOwners(owners: string | undefined): { min: number | null, max: number | null } {
        if (!owners) return { min: null, max: null };

        const rangeMatch = owners.match(/(\d+)\s*\.\.\s*(\d+)/);
        if (rangeMatch) {
            return {
                min: parseInt(rangeMatch[1], 10),
                max: parseInt(rangeMatch[2], 10)
            };
        }

        const exactMatch = owners.match(/^(\d+)$/);
        if (exactMatch) {
            const value = parseInt(exactMatch[1], 10);
            return { min: value, max: null };
        }

        return { min: null, max: null };
    }

    // Lookup table helper methods (with optional transaction support)
    async getOrCreatePlatform(name: string, transaction?: sql.Transaction): Promise<number> {
        const request = transaction ? new sql.Request(transaction) : this.pool.request();
        const result = await request
            .input('name', sql.NVarChar(50), name)
            .query('SELECT id FROM platforms WHERE name = @name');

        if (result.recordset.length > 0) {
            return result.recordset[0].id;
        }

        const insertRequest = transaction ? new sql.Request(transaction) : this.pool.request();
        const insertResult = await insertRequest
            .input('name', sql.NVarChar(50), name)
            .query('INSERT INTO platforms (name) OUTPUT INSERTED.id VALUES (@name)');

        return insertResult.recordset[0].id;
    }

    async getOrCreateGenre(name: string, transaction?: sql.Transaction): Promise<number> {
        const request = transaction ? new sql.Request(transaction) : this.pool.request();
        const result = await request
            .input('name', sql.NVarChar(100), name)
            .query('SELECT id FROM genres WHERE name = @name');

        if (result.recordset.length > 0) {
            return result.recordset[0].id;
        }

        const insertRequest = transaction ? new sql.Request(transaction) : this.pool.request();
        const insertResult = await insertRequest
            .input('name', sql.NVarChar(100), name)
            .query('INSERT INTO genres (name) OUTPUT INSERTED.id VALUES (@name)');

        return insertResult.recordset[0].id;
    }

    async getOrCreateCategory(name: string, transaction?: sql.Transaction): Promise<number> {
        const request = transaction ? new sql.Request(transaction) : this.pool.request();
        const result = await request
            .input('name', sql.NVarChar(100), name)
            .query('SELECT id FROM categories WHERE name = @name');

        if (result.recordset.length > 0) {
            return result.recordset[0].id;
        }

        const insertRequest = transaction ? new sql.Request(transaction) : this.pool.request();
        const insertResult = await insertRequest
            .input('name', sql.NVarChar(100), name)
            .query('INSERT INTO categories (name) OUTPUT INSERTED.id VALUES (@name)');

        return insertResult.recordset[0].id;
    }

    async getOrCreateTag(name: string, transaction?: sql.Transaction): Promise<number> {
        const request = transaction ? new sql.Request(transaction) : this.pool.request();
        const result = await request
            .input('name', sql.NVarChar(100), name)
            .query('SELECT id FROM tags WHERE name = @name');

        if (result.recordset.length > 0) {
            return result.recordset[0].id;
        }

        const insertRequest = transaction ? new sql.Request(transaction) : this.pool.request();
        const insertResult = await insertRequest
            .input('name', sql.NVarChar(100), name)
            .query('INSERT INTO tags (name) OUTPUT INSERTED.id VALUES (@name)');

        return insertResult.recordset[0].id;
    }

    async getOrCreateLanguage(code: string, name?: string, transaction?: sql.Transaction): Promise<number> {
        const request = transaction ? new sql.Request(transaction) : this.pool.request();
        const result = await request
            .input('code', sql.NVarChar(10), code)
            .query('SELECT id FROM languages WHERE code = @code');

        if (result.recordset.length > 0) {
            return result.recordset[0].id;
        }

        const insertRequest = transaction ? new sql.Request(transaction) : this.pool.request();
        const languageName = name || code; // Use provided name or fall back to code
        const insertResult = await insertRequest
            .input('code', sql.NVarChar(10), code)
            .input('name', sql.NVarChar(100), languageName)
            .query('INSERT INTO languages (code, name) OUTPUT INSERTED.id VALUES (@code, @name)');

        return insertResult.recordset[0].id;
    }

    async getOrCreateDeveloper(name: string, transaction?: sql.Transaction): Promise<number> {
        const request = transaction ? new sql.Request(transaction) : this.pool.request();
        const result = await request
            .input('name', sql.NVarChar(255), name)
            .query('SELECT id FROM developers WHERE name = @name');

        if (result.recordset.length > 0) {
            return result.recordset[0].id;
        }

        const insertRequest = transaction ? new sql.Request(transaction) : this.pool.request();
        const insertResult = await insertRequest
            .input('name', sql.NVarChar(255), name)
            .query('INSERT INTO developers (name) OUTPUT INSERTED.id VALUES (@name)');

        return insertResult.recordset[0].id;
    }

    async getOrCreatePublisher(name: string, transaction?: sql.Transaction): Promise<number> {
        const request = transaction ? new sql.Request(transaction) : this.pool.request();
        const result = await request
            .input('name', sql.NVarChar(255), name)
            .query('SELECT id FROM publishers WHERE name = @name');

        if (result.recordset.length > 0) {
            return result.recordset[0].id;
        }

        const insertRequest = transaction ? new sql.Request(transaction) : this.pool.request();
        const insertResult = await insertRequest
            .input('name', sql.NVarChar(255), name)
            .query('INSERT INTO publishers (name) OUTPUT INSERTED.id VALUES (@name)');

        return insertResult.recordset[0].id;
    }

    // Relationship management methods
    async setGamePlatforms(gameId: number, platformNames: string[]): Promise<void> {
        // Remove existing platforms
        await this.pool.request()
            .input('game_id', sql.Int, gameId)
            .query('DELETE FROM game_platforms WHERE game_id = @game_id');

        // Add new platforms
        for (const platformName of platformNames) {
            const platformId = await this.getOrCreatePlatform(platformName);
            await this.pool.request()
                .input('game_id', sql.Int, gameId)
                .input('platform_id', sql.Int, platformId)
                .query(`
                    INSERT INTO game_platforms (game_id, platform_id)
                    SELECT @game_id, @platform_id
                    WHERE NOT EXISTS (
                        SELECT 1 FROM game_platforms 
                        WHERE game_id = @game_id AND platform_id = @platform_id
                    )
                `);
        }
    }

    async setGameGenres(gameId: number, genreNames: string[]): Promise<void> {
        // Remove existing genres
        await this.pool.request()
            .input('game_id', sql.Int, gameId)
            .query('DELETE FROM game_genres WHERE game_id = @game_id');

        // Add new genres
        for (const genreName of genreNames) {
            const genreId = await this.getOrCreateGenre(genreName);
            await this.pool.request()
                .input('game_id', sql.Int, gameId)
                .input('genre_id', sql.Int, genreId)
                .query(`
                    INSERT INTO game_genres (game_id, genre_id)
                    SELECT @game_id, @genre_id
                    WHERE NOT EXISTS (
                        SELECT 1 FROM game_genres 
                        WHERE game_id = @game_id AND genre_id = @genre_id
                    )
                `);
        }
    }

    async setGameCategories(gameId: number, categoryNames: string[]): Promise<void> {
        // Remove existing categories
        await this.pool.request()
            .input('game_id', sql.Int, gameId)
            .query('DELETE FROM game_categories WHERE game_id = @game_id');

        // Add new categories
        for (const categoryName of categoryNames) {
            const categoryId = await this.getOrCreateCategory(categoryName);
            await this.pool.request()
                .input('game_id', sql.Int, gameId)
                .input('category_id', sql.Int, categoryId)
                .query(`
                    INSERT INTO game_categories (game_id, category_id)
                    SELECT @game_id, @category_id
                    WHERE NOT EXISTS (
                        SELECT 1 FROM game_categories 
                        WHERE game_id = @game_id AND category_id = @category_id
                    )
                `);
        }
    }

    async setGameTags(gameId: number, tagNames: string[]): Promise<void> {
        // Remove existing tags
        await this.pool.request()
            .input('game_id', sql.Int, gameId)
            .query('DELETE FROM game_tags WHERE game_id = @game_id');

        // Add new tags
        for (const tagName of tagNames) {
            const tagId = await this.getOrCreateTag(tagName);
            await this.pool.request()
                .input('game_id', sql.Int, gameId)
                .input('tag_id', sql.Int, tagId)
                .query(`
                    INSERT INTO game_tags (game_id, tag_id)
                    SELECT @game_id, @tag_id
                    WHERE NOT EXISTS (
                        SELECT 1 FROM game_tags 
                        WHERE game_id = @game_id AND tag_id = @tag_id
                    )
                `);
        }
    }

    async setGameDevelopers(gameId: number, developerNames: string[]): Promise<void> {
        // Remove existing developers
        await this.pool.request()
            .input('game_id', sql.Int, gameId)
            .query('DELETE FROM game_developers WHERE game_id = @game_id');

        // Add new developers
        for (const developerName of developerNames) {
            const developerId = await this.getOrCreateDeveloper(developerName);
            await this.pool.request()
                .input('game_id', sql.Int, gameId)
                .input('developer_id', sql.Int, developerId)
                .query(`
                    INSERT INTO game_developers (game_id, developer_id)
                    SELECT @game_id, @developer_id
                    WHERE NOT EXISTS (
                        SELECT 1 FROM game_developers 
                        WHERE game_id = @game_id AND developer_id = @developer_id
                    )
                `);
        }
    }

    async setGamePublishers(gameId: number, publisherNames: string[]): Promise<void> {
        // Remove existing publishers
        await this.pool.request()
            .input('game_id', sql.Int, gameId)
            .query('DELETE FROM game_publishers WHERE game_id = @game_id');

        // Add new publishers
        for (const publisherName of publisherNames) {
            const publisherId = await this.getOrCreatePublisher(publisherName);
            await this.pool.request()
                .input('game_id', sql.Int, gameId)
                .input('publisher_id', sql.Int, publisherId)
                .query(`
                    INSERT INTO game_publishers (game_id, publisher_id)
                    SELECT @game_id, @publisher_id
                    WHERE NOT EXISTS (
                        SELECT 1 FROM game_publishers 
                        WHERE game_id = @game_id AND publisher_id = @publisher_id
                    )
                `);
        }
    }

    async setGameLanguages(gameId: number, languages: GameLanguageSupport[] | string[]): Promise<void> {
        // Remove existing languages
        await this.pool.request()
            .input('game_id', sql.Int, gameId)
            .query('DELETE FROM game_languages WHERE game_id = @game_id');

        // Add new languages
        for (const lang of languages) {
            let languageId: number;
            let hasInterface = false;
            let hasFullAudio = false;
            let hasSubtitles = false;

            if (typeof lang === 'string') {
                // Simple string format (just language code)
                languageId = await this.getOrCreateLanguage(lang);
            } else {
                // Object format with support info
                if (lang.code) {
                    languageId = await this.getOrCreateLanguage(lang.code);
                } else if (lang.language_id) {
                    languageId = lang.language_id;
                } else {
                    throw new Error('GameLanguageSupport must have either code or language_id');
                }
                hasInterface = lang.has_interface || false;
                hasFullAudio = lang.has_full_audio || false;
                hasSubtitles = lang.has_subtitles || false;
            }

            await this.pool.request()
                .input('game_id', sql.Int, gameId)
                .input('language_id', sql.Int, languageId)
                .input('has_interface', sql.Bit, hasInterface)
                .input('has_full_audio', sql.Bit, hasFullAudio)
                .input('has_subtitles', sql.Bit, hasSubtitles)
                .query(`
                    INSERT INTO game_languages (game_id, language_id, has_interface, has_full_audio, has_subtitles)
                    SELECT @game_id, @language_id, @has_interface, @has_full_audio, @has_subtitles
                    WHERE NOT EXISTS (
                        SELECT 1 FROM game_languages 
                        WHERE game_id = @game_id AND language_id = @language_id 
                        AND has_interface = @has_interface AND has_full_audio = @has_full_audio 
                        AND has_subtitles = @has_subtitles
                    )
                `);
        }
    }

    // Game operations
    async upsertGame(game: Game): Promise<number> {
        const transaction = new sql.Transaction(this.pool);

        try {
            await transaction.begin();

            // Parse owners if provided as string
            let minOwners = game.min_owners;
            let maxOwners = game.max_owners;
            if (game.min_owners === undefined && game.max_owners === undefined) {
                // Try to parse from legacy owners field if present
                const owners = (game as any).owners;
                if (owners) {
                    const parsed = this.parseOwners(owners);
                    minOwners = parsed.min || undefined;
                    maxOwners = parsed.max || undefined;
                }
            }

            // Handle developers
            const developerNames: string[] = game.developers || [];

            // Handle publishers
            const publisherNames: string[] = game.publishers || [];

            // Check if game exists
            const checkResult = await new sql.Request(transaction)
                .input('steam_appid', sql.Int, game.steam_appid)
                .query('SELECT id FROM games WHERE steam_appid = @steam_appid');

            let gameId: number;

            if (checkResult.recordset.length > 0) {
                gameId = checkResult.recordset[0].id;
                // Update existing game
                await new sql.Request(transaction)
                    .input('id', sql.Int, gameId)
                    .input('name', sql.NVarChar(255), game.name)
                    .input('release_date', sql.Date, game.release_date)
                    .input('header_image_url', sql.NVarChar(500), game.header_image_url)
                    .input('price', sql.NVarChar(50), game.price)
                    .input('original_price', sql.NVarChar(50), game.original_price)
                    .input('discount_percent', sql.Int, game.discount_percent)
                    .input('currency', sql.NVarChar(10), game.currency)
                    .input('short_description', sql.NVarChar(sql.MAX), game.short_description)
                    .input('metacritic_score', sql.Int, game.metacritic_score)
                    .input('recommendations', sql.Int, game.recommendations)
                    .input('is_unlisted', sql.Bit, game.is_unlisted)
                    .input('is_removed', sql.Bit, game.is_removed)
                    .input('main_story_hours', sql.Decimal(10, 2), game.main_story_hours)
                    .input('main_sides_hours', sql.Decimal(10, 2), game.main_sides_hours)
                    .input('completionist_hours', sql.Decimal(10, 2), game.completionist_hours)
                    .input('all_styles_hours', sql.Decimal(10, 2), game.all_styles_hours)
                    .input('alias', sql.NVarChar(255), game.alias)
                    .input('score_rank', sql.Int, game.score_rank)
                    .input('min_owners', sql.Int, minOwners)
                    .input('max_owners', sql.Int, maxOwners)
                    .input('peak_ccu', sql.Int, game.peak_ccu)
                    .query(`
                        UPDATE games SET
                            name = @name,
                            release_date = @release_date,
                            header_image_url = @header_image_url,
                            updated_at = GETDATE(),
                            price = @price,
                            original_price = @original_price,
                            discount_percent = @discount_percent,
                            currency = @currency,
                            short_description = @short_description,
                            metacritic_score = @metacritic_score,
                            recommendations = @recommendations,
                            is_unlisted = @is_unlisted,
                            is_removed = @is_removed,
                            main_story_hours = @main_story_hours,
                            main_sides_hours = @main_sides_hours,
                            completionist_hours = @completionist_hours,
                            all_styles_hours = @all_styles_hours,
                            alias = @alias,
                            score_rank = @score_rank,
                            min_owners = @min_owners,
                            max_owners = @max_owners,
                            peak_ccu = @peak_ccu
                        WHERE id = @id
                    `);
            } else {
                // Insert new game
                const insertResult = await new sql.Request(transaction)
                    .input('steam_appid', sql.Int, game.steam_appid)
                    .input('name', sql.NVarChar(255), game.name)
                    .input('release_date', sql.Date, game.release_date)
                    .input('header_image_url', sql.NVarChar(500), game.header_image_url)
                    .input('price', sql.NVarChar(50), game.price)
                    .input('original_price', sql.NVarChar(50), game.original_price)
                    .input('discount_percent', sql.Int, game.discount_percent)
                    .input('currency', sql.NVarChar(10), game.currency)
                    .input('short_description', sql.NVarChar(sql.MAX), game.short_description)
                    .input('metacritic_score', sql.Int, game.metacritic_score)
                    .input('recommendations', sql.Int, game.recommendations)
                    .input('is_unlisted', sql.Bit, game.is_unlisted)
                    .input('is_removed', sql.Bit, game.is_removed)
                    .input('main_story_hours', sql.Decimal(10, 2), game.main_story_hours)
                    .input('main_sides_hours', sql.Decimal(10, 2), game.main_sides_hours)
                    .input('completionist_hours', sql.Decimal(10, 2), game.completionist_hours)
                    .input('all_styles_hours', sql.Decimal(10, 2), game.all_styles_hours)
                    .input('alias', sql.NVarChar(255), game.alias)
                    .input('score_rank', sql.Int, game.score_rank)
                    .input('min_owners', sql.Int, minOwners)
                    .input('max_owners', sql.Int, maxOwners)
                    .input('peak_ccu', sql.Int, game.peak_ccu)
                    .query(`
                        INSERT INTO games (steam_appid, name, release_date, header_image_url,
                            price, original_price, discount_percent, currency, short_description,
                            metacritic_score, recommendations, is_unlisted, is_removed,
                            main_story_hours, main_sides_hours, completionist_hours, all_styles_hours,
                            alias, score_rank, min_owners, max_owners, peak_ccu)
                        OUTPUT INSERTED.id
                        VALUES (@steam_appid, @name, @release_date, @header_image_url,
                            @price, @original_price, @discount_percent, @currency, @short_description,
                            @metacritic_score, @recommendations, @is_unlisted, @is_removed,
                            @main_story_hours, @main_sides_hours, @completionist_hours, @all_styles_hours,
                            @alias, @score_rank, @min_owners, @max_owners, @peak_ccu)
                    `);
                gameId = insertResult.recordset[0].id;
            }

            // Update relationships (using transaction-aware helper methods)
            if (developerNames.length > 0) {
                await new sql.Request(transaction)
                    .input('game_id', sql.Int, gameId)
                    .query('DELETE FROM game_developers WHERE game_id = @game_id');
                for (const developerName of developerNames) {
                    const developerId = await this.getOrCreateDeveloper(developerName, transaction);
                    await new sql.Request(transaction)
                        .input('game_id', sql.Int, gameId)
                        .input('developer_id', sql.Int, developerId)
                        .query(`
                            INSERT INTO game_developers (game_id, developer_id)
                            SELECT @game_id, @developer_id
                            WHERE NOT EXISTS (
                                SELECT 1 FROM game_developers 
                                WHERE game_id = @game_id AND developer_id = @developer_id
                            )
                        `);
                }
            }

            if (publisherNames.length > 0) {
                await new sql.Request(transaction)
                    .input('game_id', sql.Int, gameId)
                    .query('DELETE FROM game_publishers WHERE game_id = @game_id');
                for (const publisherName of publisherNames) {
                    const publisherId = await this.getOrCreatePublisher(publisherName, transaction);
                    await new sql.Request(transaction)
                        .input('game_id', sql.Int, gameId)
                        .input('publisher_id', sql.Int, publisherId)
                        .query(`
                            INSERT INTO game_publishers (game_id, publisher_id)
                            SELECT @game_id, @publisher_id
                            WHERE NOT EXISTS (
                                SELECT 1 FROM game_publishers 
                                WHERE game_id = @game_id AND publisher_id = @publisher_id
                            )
                        `);
                }
            }

            if (game.platforms && game.platforms.length > 0) {
                await new sql.Request(transaction)
                    .input('game_id', sql.Int, gameId)
                    .query('DELETE FROM game_platforms WHERE game_id = @game_id');
                for (const platformName of game.platforms) {
                    const platformId = await this.getOrCreatePlatform(platformName, transaction);
                    await new sql.Request(transaction)
                        .input('game_id', sql.Int, gameId)
                        .input('platform_id', sql.Int, platformId)
                        .query(`
                            INSERT INTO game_platforms (game_id, platform_id)
                            SELECT @game_id, @platform_id
                            WHERE NOT EXISTS (
                                SELECT 1 FROM game_platforms 
                                WHERE game_id = @game_id AND platform_id = @platform_id
                            )
                        `);
                }
            }

            if (game.genres && game.genres.length > 0) {
                await new sql.Request(transaction)
                    .input('game_id', sql.Int, gameId)
                    .query('DELETE FROM game_genres WHERE game_id = @game_id');
                for (const genreName of game.genres) {
                    const genreId = await this.getOrCreateGenre(genreName, transaction);
                    await new sql.Request(transaction)
                        .input('game_id', sql.Int, gameId)
                        .input('genre_id', sql.Int, genreId)
                        .query(`
                            INSERT INTO game_genres (game_id, genre_id)
                            SELECT @game_id, @genre_id
                            WHERE NOT EXISTS (
                                SELECT 1 FROM game_genres 
                                WHERE game_id = @game_id AND genre_id = @genre_id
                            )
                        `);
                }
            }

            if (game.categories && game.categories.length > 0) {
                await new sql.Request(transaction)
                    .input('game_id', sql.Int, gameId)
                    .query('DELETE FROM game_categories WHERE game_id = @game_id');
                for (const categoryName of game.categories) {
                    const categoryId = await this.getOrCreateCategory(categoryName, transaction);
                    await new sql.Request(transaction)
                        .input('game_id', sql.Int, gameId)
                        .input('category_id', sql.Int, categoryId)
                        .query(`
                            INSERT INTO game_categories (game_id, category_id)
                            SELECT @game_id, @category_id
                            WHERE NOT EXISTS (
                                SELECT 1 FROM game_categories 
                                WHERE game_id = @game_id AND category_id = @category_id
                            )
                        `);
                }
            }

            if (game.tags && game.tags.length > 0) {
                await new sql.Request(transaction)
                    .input('game_id', sql.Int, gameId)
                    .query('DELETE FROM game_tags WHERE game_id = @game_id');
                for (const tagName of game.tags) {
                    const tagId = await this.getOrCreateTag(tagName, transaction);
                    await new sql.Request(transaction)
                        .input('game_id', sql.Int, gameId)
                        .input('tag_id', sql.Int, tagId)
                        .query(`
                            INSERT INTO game_tags (game_id, tag_id)
                            SELECT @game_id, @tag_id
                            WHERE NOT EXISTS (
                                SELECT 1 FROM game_tags 
                                WHERE game_id = @game_id AND tag_id = @tag_id
                            )
                        `);
                }
            }

            if (game.languages && game.languages.length > 0) {
                await new sql.Request(transaction)
                    .input('game_id', sql.Int, gameId)
                    .query('DELETE FROM game_languages WHERE game_id = @game_id');
                for (const lang of game.languages) {
                    let languageId: number;
                    let hasInterface = false;
                    let hasFullAudio = false;
                    let hasSubtitles = false;

                    if (typeof lang === 'string') {
                        // Simple string format (just language code)
                        languageId = await this.getOrCreateLanguage(lang, undefined, transaction);
                    } else {
                        // Object format with support info
                        if (lang.code) {
                            languageId = await this.getOrCreateLanguage(lang.code, undefined, transaction);
                        } else if (lang.language_id) {
                            languageId = lang.language_id;
                        } else {
                            throw new Error('GameLanguageSupport must have either code or language_id');
                        }
                        hasInterface = lang.has_interface || false;
                        hasFullAudio = lang.has_full_audio || false;
                        hasSubtitles = lang.has_subtitles || false;
                    }

                    await new sql.Request(transaction)
                        .input('game_id', sql.Int, gameId)
                        .input('language_id', sql.Int, languageId)
                        .input('has_interface', sql.Bit, hasInterface)
                        .input('has_full_audio', sql.Bit, hasFullAudio)
                        .input('has_subtitles', sql.Bit, hasSubtitles)
                        .query(`
                            INSERT INTO game_languages (game_id, language_id, has_interface, has_full_audio, has_subtitles)
                            SELECT @game_id, @language_id, @has_interface, @has_full_audio, @has_subtitles
                            WHERE NOT EXISTS (
                                SELECT 1 FROM game_languages 
                                WHERE game_id = @game_id AND language_id = @language_id 
                                AND has_interface = @has_interface AND has_full_audio = @has_full_audio 
                                AND has_subtitles = @has_subtitles
                            )
                        `);
                }
            }

            await transaction.commit();
            return gameId;
        } catch (error) {
            await transaction.rollback();
            console.error('Error upserting game:', error);
            throw error;
        }
    }

    // Achievement operations
    async upsertAchievement(achievement: Achievement): Promise<number> {
        try {
            // Check if achievement exists (by game_id and steam_apiname)
            const checkResult = await this.pool.request()
                .input('game_id', sql.Int, achievement.game_id)
                .input('steam_apiname', sql.NVarChar(255), achievement.steam_apiname)
                .query('SELECT id FROM achievements WHERE game_id = @game_id AND steam_apiname = @steam_apiname');

            if (checkResult.recordset.length > 0) {
                // Update existing achievement - SQL will use created_at if last_updated is NULL
                await this.pool.request()
                    .input('id', sql.Int, checkResult.recordset[0].id)
                    .input('name', sql.NVarChar(255), achievement.name)
                    .input('description', sql.NVarChar(sql.MAX), achievement.description)
                    .input('icon_url', sql.NVarChar(500), achievement.icon_url)
                    .input('points', sql.Int, achievement.points)
                    .input('is_hidden', sql.Bit, achievement.is_hidden)
                    .input('description_source', sql.NVarChar(50), achievement.description_source)
                    .input('last_updated', sql.DateTime2, achievement.last_updated)
                    .query(`
                        UPDATE achievements SET
                            name = @name,
                            description = @description,
                            icon_url = @icon_url,
                            points = @points,
                            is_hidden = @is_hidden,
                            description_source = @description_source,
                            last_updated = COALESCE(@last_updated, created_at)
                        WHERE id = @id
                    `);
                return checkResult.recordset[0].id;
            } else {
                // Insert new achievement - SQL will use GETDATE() if last_updated is NULL
                const insertResult = await this.pool.request()
                    .input('game_id', sql.Int, achievement.game_id)
                    .input('steam_apiname', sql.NVarChar(255), achievement.steam_apiname)
                    .input('name', sql.NVarChar(255), achievement.name)
                    .input('description', sql.NVarChar(sql.MAX), achievement.description)
                    .input('icon_url', sql.NVarChar(500), achievement.icon_url)
                    .input('points', sql.Int, achievement.points)
                    .input('is_hidden', sql.Bit, achievement.is_hidden)
                    .input('description_source', sql.NVarChar(50), achievement.description_source)
                    .input('last_updated', sql.DateTime2, achievement.last_updated)
                    .query(`
                        INSERT INTO achievements (game_id, steam_apiname, name, description, icon_url, points, is_hidden,
                            description_source, last_updated)
                        OUTPUT INSERTED.id
                        VALUES (@game_id, @steam_apiname, @name, @description, @icon_url, @points, @is_hidden,
                            @description_source, COALESCE(@last_updated, GETDATE()))
                    `);
                return insertResult.recordset[0].id;
            }
        } catch (error) {
            console.error('Error upserting achievement:', error);
            throw error;
        }
    }

    // User operations
    async upsertUser(user: User): Promise<number> {
        try {
            // Convert steam_id to BigInt safely (handles string, number, or bigint)
            let steamIdValue: bigint;
            if (typeof user.steam_id === 'string') {
                steamIdValue = BigInt(user.steam_id);
            } else if (typeof user.steam_id === 'bigint') {
                steamIdValue = user.steam_id;
            } else {
                steamIdValue = BigInt(user.steam_id);
            }

            // Convert BigInt to string for SQL (mssql doesn't support BigInt directly)
            // We'll cast it in SQL to BIGINT
            const steamIdStr = steamIdValue.toString();

            // Check if user exists
            const checkResult = await this.pool.request()
                .input('steam_id', sql.NVarChar(50), steamIdStr)
                .query('SELECT id FROM users WHERE steam_id = CAST(@steam_id AS BIGINT)');

            if (checkResult.recordset.length > 0) {
                // Update existing user
                await this.pool.request()
                    .input('id', sql.Int, checkResult.recordset[0].id)
                    .input('username', sql.NVarChar(255), user.username)
                    .input('profile_url', sql.NVarChar(500), user.profile_url)
                    .input('avatar_url', sql.NVarChar(500), user.avatar_url)
                    .query(`
                        UPDATE users SET
                            username = @username,
                            profile_url = @profile_url,
                            avatar_url = @avatar_url
                        WHERE id = @id
                    `);
                return checkResult.recordset[0].id;
            } else {
                // Insert new user
                const insertResult = await this.pool.request()
                    .input('steam_id', sql.NVarChar(50), steamIdStr)
                    .input('username', sql.NVarChar(255), user.username)
                    .input('profile_url', sql.NVarChar(500), user.profile_url)
                    .input('avatar_url', sql.NVarChar(500), user.avatar_url)
                    .query(`
                        INSERT INTO users (steam_id, username, profile_url, avatar_url)
                        OUTPUT INSERTED.id
                        VALUES (CAST(@steam_id AS BIGINT), @username, @profile_url, @avatar_url)
                    `);
                return insertResult.recordset[0].id;
            }
        } catch (error) {
            console.error('Error upserting user:', error);
            throw error;
        }
    }

    // User achievement operations
    async upsertUserAchievement(userAchievement: UserAchievement): Promise<number> {
        try {
            // Check if user achievement exists
            const checkResult = await this.pool.request()
                .input('user_id', sql.Int, userAchievement.user_id)
                .input('achievement_id', sql.Int, userAchievement.achievement_id)
                .query('SELECT id FROM user_achievements WHERE user_id = @user_id AND achievement_id = @achievement_id');

            if (checkResult.recordset.length > 0) {
                // Update existing user achievement
                await this.pool.request()
                    .input('id', sql.Int, checkResult.recordset[0].id)
                    .input('unlocked_at', sql.DateTime2, userAchievement.unlocked_at)
                    .query(`
                        UPDATE user_achievements SET
                            unlocked_at = @unlocked_at
                        WHERE id = @id
                    `);
                return checkResult.recordset[0].id;
            } else {
                // Insert new user achievement
                const insertResult = await this.pool.request()
                    .input('user_id', sql.Int, userAchievement.user_id)
                    .input('achievement_id', sql.Int, userAchievement.achievement_id)
                    .input('unlocked_at', sql.DateTime2, userAchievement.unlocked_at)
                    .query(`
                        INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
                        OUTPUT INSERTED.id
                        VALUES (@user_id, @achievement_id, @unlocked_at)
                    `);
                return insertResult.recordset[0].id;
            }
        } catch (error) {
            console.error('Error upserting user achievement:', error);
            throw error;
        }
    }

    // Get game with achievements
    async getGameWithAchievements(steamAppId: number): Promise<any> {
        try {
            const result = await this.pool.request()
                .input('steam_appid', sql.Int, steamAppId)
                .query(`
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
                    WHERE g.steam_appid = @steam_appid
                    ORDER BY a.points DESC, a.name
                `);
            return result.recordset;
        } catch (error) {
            console.error('Error getting game with achievements:', error);
            throw error;
        }
    }

    // Get user achievements for a game
    async getUserGameAchievements(userId: number, gameId: number): Promise<any> {
        try {
            const result = await this.pool.request()
                .input('user_id', sql.Int, userId)
                .input('game_id', sql.Int, gameId)
                .query(`
                    SELECT 
                        a.*,
                        ua.unlocked_at,
                        CASE WHEN ua.id IS NOT NULL THEN 1 ELSE 0 END as is_unlocked,
                        CASE 
                            WHEN a.is_hidden = 1 AND (a.description IS NULL OR a.description = '') THEN 'Hidden Achievement'
                            WHEN a.is_hidden = 1 AND a.description LIKE 'Hidden Achievement%' THEN a.description
                            ELSE a.description
                        END as display_description
                    FROM achievements a
                    LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = @user_id
                    WHERE a.game_id = @game_id
                    ORDER BY a.points DESC, a.name
                `);
            return result.recordset;
        } catch (error) {
            console.error('Error getting user game achievements:', error);
            throw error;
        }
    }

    // Get achievements for a game with enhanced hidden achievement handling
    async getGameAchievements(steamAppId: number): Promise<any> {
        try {
            const result = await this.pool.request()
                .input('steam_appid', sql.Int, steamAppId)
                .query(`
                    SELECT 
                        a.*,
                        CASE 
                            WHEN a.is_hidden = 1 AND (a.description IS NULL OR a.description = '') THEN 'Hidden Achievement - ' + a.name
                            WHEN a.is_hidden = 1 AND a.description LIKE 'Hidden Achievement%' THEN a.description
                            ELSE a.description
                        END as display_description,
                        CASE 
                            WHEN a.is_hidden = 1 THEN 'Hidden'
                            ELSE 'Visible'
                        END as visibility_status
                    FROM achievements a
                    JOIN games g ON a.game_id = g.id
                    WHERE g.steam_appid = @steam_appid
                    ORDER BY a.is_hidden ASC, a.points DESC, a.name
                `);
            return result.recordset;
        } catch (error) {
            console.error('Error getting game achievements:', error);
            throw error;
        }
    }

    // Helper method to get game ID by steam_appid
    async getGameIdBySteamAppId(steamAppId: number): Promise<number | null> {
        try {
            const result = await this.pool.request()
                .input('steam_appid', sql.Int, steamAppId)
                .query('SELECT id FROM games WHERE steam_appid = @steam_appid');

            if (result.recordset.length > 0) {
                return result.recordset[0].id;
            }
            return null;
        } catch (error) {
            console.error('Error getting game ID by steam_appid:', error);
            throw error;
        }
    }

    // Helper method to get achievement ID by game_id and steam_apiname
    async getAchievementIdBySteamApiname(gameId: number, steamApiname: string): Promise<number | null> {
        try {
            const result = await this.pool.request()
                .input('game_id', sql.Int, gameId)
                .input('steam_apiname', sql.NVarChar(255), steamApiname)
                .query('SELECT id FROM achievements WHERE game_id = @game_id AND steam_apiname = @steam_apiname');

            if (result.recordset.length > 0) {
                return result.recordset[0].id;
            }
            return null;
        } catch (error) {
            console.error('Error getting achievement ID by steam_apiname:', error);
            throw error;
        }
    }

    // Delete user and all their achievements
    async deleteUserBySteamId(steamId: number | string | bigint): Promise<boolean> {
        try {
            // Convert steam_id to BigInt safely (handles string, number, or bigint)
            let steamIdValue: bigint;
            if (typeof steamId === 'string') {
                steamIdValue = BigInt(steamId);
            } else if (typeof steamId === 'bigint') {
                steamIdValue = steamId;
            } else {
                steamIdValue = BigInt(steamId);
            }

            // Convert BigInt to string for SQL (mssql doesn't support BigInt directly)
            const steamIdStr = steamIdValue.toString();

            // First, get the user ID
            const userResult = await this.pool.request()
                .input('steam_id', sql.NVarChar(50), steamIdStr)
                .query('SELECT id FROM users WHERE steam_id = CAST(@steam_id AS BIGINT)');

            if (userResult.recordset.length === 0) {
                console.log(`User with steam_id ${steamId} not found`);
                return false;
            }

            const userId = userResult.recordset[0].id;

            // Delete user achievements first (due to foreign key constraint)
            const deleteAchievementsResult = await this.pool.request()
                .input('user_id', sql.Int, userId)
                .query('DELETE FROM user_achievements WHERE user_id = @user_id');

            console.log(`Deleted ${deleteAchievementsResult.rowsAffected[0]} user achievements`);

            // Delete the user
            await this.pool.request()
                .input('user_id', sql.Int, userId)
                .query('DELETE FROM users WHERE id = @user_id');

            console.log(`Deleted user with steam_id ${steamId}`);
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }
}
