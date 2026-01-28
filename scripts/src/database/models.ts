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
    steam_id: bigint;
    username: string;
    profile_url?: string;
    avatar_url?: string;
    is_active?: boolean;
    created_at?: Date;
}

export interface UserAchievement {
    id?: number;
    user_id: number;
    achievement_id: number;
    unlocked_at?: Date;
    created_at?: Date;
}

export interface UserGame {
    id?: number;
    user_id: number;
    game_id: number;
    playtime_forever: number; // in minutes
    playtime_2weeks: number; // in minutes
    last_played_at?: Date;
}

export interface AchievementStats {
    achievement_id: number;
    global_percentage: number;
    updated_at?: Date;
}

// Return type interfaces for query results
export interface GameWithAchievementsResult {
    // Game fields
    id: number;
    steam_appid: number;
    name: string;
    release_date?: Date;
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
    min_owners?: number;
    max_owners?: number | null;
    peak_ccu?: number;
    // Achievement fields (nullable when LEFT JOIN returns no achievement)
    achievement_id?: number;
    steam_apiname?: string;
    achievement_name?: string;
    achievement_description?: string;
    achievement_icon?: string;
    points?: number;
    is_hidden?: boolean;
}

export interface UserGameAchievementResult {
    // Achievement fields
    id: number;
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
    // User achievement fields
    unlocked_at?: Date;
    is_unlocked: boolean; // BIT type
}

export interface GameAchievementResult {
    // Achievement fields only (no redundant game data)
    id: number;
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

export interface GameAchievementsResponse {
    gameExists: boolean;
    achievements: GameAchievementResult[];
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
        interface PlatformIdResult {
            id: number;
        }
        const result = await request
            .input('name', sql.NVarChar(50), name)
            .query<PlatformIdResult>('SELECT TOP 1 Id FROM SteamPlatforms WHERE Name = @name');

        const existing = result.recordset[0];
        if (existing) {
            return existing.id;
        }

        const insertRequest = transaction ? new sql.Request(transaction) : this.pool.request();
        const insertResult = await insertRequest
            .input('name', sql.NVarChar(50), name)
            .query<{ id: number }>('INSERT INTO SteamPlatforms (Name) OUTPUT INSERTED.Id as id VALUES (@name)');

        return insertResult.recordset[0].id;
    }

    async getOrCreateGenre(name: string, transaction?: sql.Transaction): Promise<number> {
        const request = transaction ? new sql.Request(transaction) : this.pool.request();
        interface GenreIdResult {
            id: number;
        }
        const result = await request
            .input('name', sql.NVarChar(100), name)
            .query<GenreIdResult>('SELECT TOP 1 Id as id FROM SteamGenres WHERE Name = @name');

        const existing = result.recordset[0];
        if (existing) {
            return existing.id;
        }

        const insertRequest = transaction ? new sql.Request(transaction) : this.pool.request();
        const insertResult = await insertRequest
            .input('name', sql.NVarChar(100), name)
            .query<{ id: number }>('INSERT INTO SteamGenres (Name) OUTPUT INSERTED.Id as id VALUES (@name)');

        return insertResult.recordset[0].id;
    }

    async getOrCreateCategory(name: string, transaction?: sql.Transaction): Promise<number> {
        const request = transaction ? new sql.Request(transaction) : this.pool.request();
        interface CategoryIdResult {
            id: number;
        }
        const result = await request
            .input('name', sql.NVarChar(100), name)
            .query<CategoryIdResult>('SELECT TOP 1 Id as id FROM SteamCategories WHERE Name = @name');

        const existing = result.recordset[0];
        if (existing) {
            return existing.id;
        }

        const insertRequest = transaction ? new sql.Request(transaction) : this.pool.request();
        const insertResult = await insertRequest
            .input('name', sql.NVarChar(100), name)
            .query<{ id: number }>('INSERT INTO SteamCategories (Name) OUTPUT INSERTED.Id as id VALUES (@name)');

        return insertResult.recordset[0].id;
    }

    async getOrCreateTag(name: string, transaction?: sql.Transaction): Promise<number> {
        const request = transaction ? new sql.Request(transaction) : this.pool.request();
        interface TagIdResult {
            id: number;
        }
        const result = await request
            .input('name', sql.NVarChar(100), name)
            .query<TagIdResult>('SELECT TOP 1 Id as id FROM SteamTags WHERE Name = @name');

        const existing = result.recordset[0];
        if (existing) {
            return existing.id;
        }

        const insertRequest = transaction ? new sql.Request(transaction) : this.pool.request();
        const insertResult = await insertRequest
            .input('name', sql.NVarChar(100), name)
            .query<{ id: number }>('INSERT INTO SteamTags (Name) OUTPUT INSERTED.Id as id VALUES (@name)');

        return insertResult.recordset[0].id;
    }

    async getOrCreateLanguage(code: string, name?: string, transaction?: sql.Transaction): Promise<number> {
        const request = transaction ? new sql.Request(transaction) : this.pool.request();
        interface LanguageIdResult {
            id: number;
        }
        const result = await request
            .input('code', sql.NVarChar(10), code)
            .query<LanguageIdResult>('SELECT TOP 1 Id as id FROM SteamLanguages WHERE Code = @code');

        const existing = result.recordset[0];
        if (existing) {
            return existing.id;
        }

        const insertRequest = transaction ? new sql.Request(transaction) : this.pool.request();
        const languageName = name || code;
        const insertResult = await insertRequest
            .input('code', sql.NVarChar(10), code)
            .input('name', sql.NVarChar(100), languageName)
            .query<{ id: number }>('INSERT INTO SteamLanguages (Code, Name) OUTPUT INSERTED.Id as id VALUES (@code, @name)');

        return insertResult.recordset[0].id;
    }

    async getOrCreateDeveloper(name: string, transaction?: sql.Transaction): Promise<number> {
        const request = transaction ? new sql.Request(transaction) : this.pool.request();
        interface DeveloperIdResult {
            id: number;
        }
        const result = await request
            .input('name', sql.NVarChar(255), name)
            .query<DeveloperIdResult>('SELECT TOP 1 Id as id FROM SteamDevelopers WHERE Name = @name');

        const existing = result.recordset[0];
        if (existing) {
            return existing.id;
        }

        const insertRequest = transaction ? new sql.Request(transaction) : this.pool.request();
        const insertResult = await insertRequest
            .input('name', sql.NVarChar(255), name)
            .query<{ id: number }>('INSERT INTO SteamDevelopers (Name) OUTPUT INSERTED.Id as id VALUES (@name)');

        return insertResult.recordset[0].id;
    }

    async getOrCreatePublisher(name: string, transaction?: sql.Transaction): Promise<number> {
        const request = transaction ? new sql.Request(transaction) : this.pool.request();
        interface PublisherIdResult {
            id: number;
        }
        const result = await request
            .input('name', sql.NVarChar(255), name)
            .query<PublisherIdResult>('SELECT TOP 1 Id as id FROM SteamPublishers WHERE Name = @name');

        const existing = result.recordset[0];
        if (existing) {
            return existing.id;
        }

        const insertRequest = transaction ? new sql.Request(transaction) : this.pool.request();
        const insertResult = await insertRequest
            .input('name', sql.NVarChar(255), name)
            .query<{ id: number }>('INSERT INTO SteamPublishers (Name) OUTPUT INSERTED.Id as id VALUES (@name)');

        return insertResult.recordset[0].id;
    }

    // Relationship management methods
    async setGamePlatforms(gameId: number, platformNames: string[]): Promise<void> {
        // Remove existing platforms
        await this.pool.request()
            .input('game_id', sql.Int, gameId)
            .query('DELETE FROM SteamGamePlatforms WHERE GameId = @game_id');

        // Add new platforms
        for (const platformName of platformNames) {
            const platformId = await this.getOrCreatePlatform(platformName);
            await this.pool.request()
                .input('game_id', sql.Int, gameId)
                .input('platform_id', sql.Int, platformId)
                .query(`
                    INSERT INTO SteamGamePlatforms (GameId, PlatformId)
                    SELECT @game_id, @platform_id
                    WHERE NOT EXISTS (
                        SELECT 1 FROM SteamGamePlatforms 
                        WHERE GameId = @game_id AND PlatformId = @platform_id
                    )
                `);
        }
    }

    async setGameGenres(gameId: number, genreNames: string[]): Promise<void> {
        // Remove existing genres
        await this.pool.request()
            .input('game_id', sql.Int, gameId)
            .query('DELETE FROM SteamGameGenres WHERE GameId = @game_id');

        // Add new genres
        for (const genreName of genreNames) {
            const genreId = await this.getOrCreateGenre(genreName);
            await this.pool.request()
                .input('game_id', sql.Int, gameId)
                .input('genre_id', sql.Int, genreId)
                .query(`
                    INSERT INTO SteamGameGenres (GameId, GenreId)
                    SELECT @game_id, @genre_id
                    WHERE NOT EXISTS (
                        SELECT 1 FROM SteamGameGenres 
                        WHERE GameId = @game_id AND GenreId = @genre_id
                    )
                `);
        }
    }

    async setGameCategories(gameId: number, categoryNames: string[]): Promise<void> {
        // Remove existing categories
        await this.pool.request()
            .input('game_id', sql.Int, gameId)
            .query('DELETE FROM SteamGameCategories WHERE GameId = @game_id');

        // Add new categories
        for (const categoryName of categoryNames) {
            const categoryId = await this.getOrCreateCategory(categoryName);
            await this.pool.request()
                .input('game_id', sql.Int, gameId)
                .input('category_id', sql.Int, categoryId)
                .query(`
                    INSERT INTO SteamGameCategories (GameId, CategoryId)
                    SELECT @game_id, @category_id
                    WHERE NOT EXISTS (
                        SELECT 1 FROM SteamGameCategories 
                        WHERE GameId = @game_id AND CategoryId = @category_id
                    )
                `);
        }
    }

    async setGameTags(gameId: number, tagNames: string[]): Promise<void> {
        // Remove existing tags
        await this.pool.request()
            .input('game_id', sql.Int, gameId)
            .query('DELETE FROM SteamGameTags WHERE GameId = @game_id');

        // Add new tags
        for (const tagName of tagNames) {
            const tagId = await this.getOrCreateTag(tagName);
            await this.pool.request()
                .input('game_id', sql.Int, gameId)
                .input('tag_id', sql.Int, tagId)
                .query(`
                    INSERT INTO SteamGameTags (GameId, TagId)
                    SELECT @game_id, @tag_id
                    WHERE NOT EXISTS (
                        SELECT 1 FROM SteamGameTags 
                        WHERE GameId = @game_id AND TagId = @tag_id
                    )
                `);
        }
    }

    async setGameDevelopers(gameId: number, developerNames: string[]): Promise<void> {
        // Remove existing developers
        await this.pool.request()
            .input('game_id', sql.Int, gameId)
            .query('DELETE FROM SteamGameDevelopers WHERE GameId = @game_id');

        // Add new developers
        for (const developerName of developerNames) {
            const developerId = await this.getOrCreateDeveloper(developerName);
            await this.pool.request()
                .input('game_id', sql.Int, gameId)
                .input('developer_id', sql.Int, developerId)
                .query(`
                    INSERT INTO SteamGameDevelopers (GameId, DeveloperId)
                    SELECT @game_id, @developer_id
                    WHERE NOT EXISTS (
                        SELECT 1 FROM SteamGameDevelopers 
                        WHERE GameId = @game_id AND DeveloperId = @developer_id
                    )
                `);
        }
    }

    async setGamePublishers(gameId: number, publisherNames: string[]): Promise<void> {
        // Remove existing publishers
        await this.pool.request()
            .input('game_id', sql.Int, gameId)
            .query('DELETE FROM SteamGamePublishers WHERE GameId = @game_id');

        // Add new publishers
        for (const publisherName of publisherNames) {
            const publisherId = await this.getOrCreatePublisher(publisherName);
            await this.pool.request()
                .input('game_id', sql.Int, gameId)
                .input('publisher_id', sql.Int, publisherId)
                .query(`
                    INSERT INTO SteamGamePublishers (GameId, PublisherId)
                    SELECT @game_id, @publisher_id
                    WHERE NOT EXISTS (
                        SELECT 1 FROM SteamGamePublishers 
                        WHERE GameId = @game_id AND PublisherId = @publisher_id
                    )
                `);
        }
    }

    async setGameLanguages(gameId: number, languages: GameLanguageSupport[] | string[]): Promise<void> {
        // Remove existing languages
        await this.pool.request()
            .input('game_id', sql.Int, gameId)
            .query('DELETE FROM SteamGameLanguages WHERE GameId = @game_id');

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
                    INSERT INTO SteamGameLanguages (GameId, LanguageId, HasInterface, HasFullAudio, HasSubtitles)
                    SELECT @game_id, @language_id, @has_interface, @has_full_audio, @has_subtitles
                    WHERE NOT EXISTS (
                        SELECT 1 FROM SteamGameLanguages 
                        WHERE GameId = @game_id AND LanguageId = @language_id 
                        AND HasInterface = @has_interface AND HasFullAudio = @has_full_audio 
                        AND HasSubtitles = @has_subtitles
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
                // Using type assertion for legacy field that may exist but isn't in interface
                interface GameWithLegacyOwners extends Game {
                    owners?: string;
                }
                const gameWithLegacy = game as GameWithLegacyOwners;
                if (gameWithLegacy.owners) {
                    const parsed = this.parseOwners(gameWithLegacy.owners);
                    minOwners = parsed.min || undefined;
                    maxOwners = parsed.max || undefined;
                }
            }

            // Handle developers
            const developerNames: string[] = game.developers || [];

            // Handle publishers
            const publisherNames: string[] = game.publishers || [];

            // Check if game exists
            interface GameIdResult {
                id: number;
            }
            const checkResult = await new sql.Request(transaction)
                .input('steam_appid', sql.Int, game.steam_appid)
                .query<GameIdResult>('SELECT TOP 1 Id as id FROM SteamGames WHERE SteamAppId = @steam_appid');

            const existingGame = checkResult.recordset[0];
            let gameId: number;

            if (existingGame) {
                gameId = existingGame.id;
                // Update existing game
                await new sql.Request(transaction)
                    .input('id', sql.Int, gameId)
                    .input('name', sql.NVarChar(255), game.name)
                    .input('release_date', sql.Date, game.release_date)
                    .input('header_image_url', sql.NVarChar(500), game.header_image_url)
                    .input('short_description', sql.NVarChar(2000), game.short_description)
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
                        UPDATE SteamGames SET
                            Name = @name,
                            ReleaseDate = @release_date,
                            HeaderImageUrl = @header_image_url,
                            UpdateDate = GETUTCDATE(),
                            ShortDescription = @short_description,
                            IsUnlisted = @is_unlisted,
                            IsRemoved = @is_removed,
                            MainStoryHours = @main_story_hours,
                            MainSidesHours = @main_sides_hours,
                            CompletionistHours = @completionist_hours,
                            AllStylesHours = @all_styles_hours,
                            Alias = @alias,
                            ScoreRank = @score_rank,
                            MinOwners = @min_owners,
                            MaxOwners = @max_owners,
                            PeakCcu = @peak_ccu
                        WHERE Id = @id
                    `);
            } else {
                // Insert new game
                const insertResult = await new sql.Request(transaction)
                    .input('steam_appid', sql.Int, game.steam_appid)
                    .input('name', sql.NVarChar(255), game.name)
                    .input('release_date', sql.Date, game.release_date)
                    .input('header_image_url', sql.NVarChar(500), game.header_image_url)
                    .input('short_description', sql.NVarChar(2000), game.short_description)
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
                        INSERT INTO SteamGames (SteamAppId, Name, ReleaseDate, HeaderImageUrl,
                            ShortDescription, IsUnlisted, IsRemoved,
                            MainStoryHours, MainSidesHours, CompletionistHours, AllStylesHours,
                            Alias, ScoreRank, MinOwners, MaxOwners, PeakCcu)
                        OUTPUT INSERTED.Id as id
                        VALUES (@steam_appid, @name, @release_date, @header_image_url,
                            @short_description, @is_unlisted, @is_removed,
                            @main_story_hours, @main_sides_hours, @completionist_hours, @all_styles_hours,
                            @alias, @score_rank, @min_owners, @max_owners, @peak_ccu)
                    `);
                gameId = insertResult.recordset[0].id;
            }

            // Update relationships (using transaction-aware helper methods)
            if (developerNames.length > 0) {
                await new sql.Request(transaction)
                    .input('game_id', sql.Int, gameId)
                    .query('DELETE FROM SteamGameDevelopers WHERE GameId = @game_id');
                for (const developerName of developerNames) {
                    const developerId = await this.getOrCreateDeveloper(developerName, transaction);
                    await new sql.Request(transaction)
                        .input('game_id', sql.Int, gameId)
                        .input('developer_id', sql.Int, developerId)
                        .query(`
                            INSERT INTO SteamGameDevelopers (game_id, developer_id)
                            SELECT @game_id, @developer_id
                            WHERE NOT EXISTS (
                                SELECT 1 FROM SteamGameDevelopers 
                                WHERE game_id = @game_id AND developer_id = @developer_id
                            )
                        `);
                }
            }

            if (publisherNames.length > 0) {
                await new sql.Request(transaction)
                    .input('game_id', sql.Int, gameId)
                    .query('DELETE FROM SteamGamePublishers WHERE GameId = @game_id');
                for (const publisherName of publisherNames) {
                    const publisherId = await this.getOrCreatePublisher(publisherName, transaction);
                    await new sql.Request(transaction)
                        .input('game_id', sql.Int, gameId)
                        .input('publisher_id', sql.Int, publisherId)
                        .query(`
                            INSERT INTO SteamGamePublishers (game_id, publisher_id)
                            SELECT @game_id, @publisher_id
                            WHERE NOT EXISTS (
                                SELECT 1 FROM SteamGamePublishers 
                                WHERE game_id = @game_id AND publisher_id = @publisher_id
                            )
                        `);
                }
            }

            if (game.platforms && game.platforms.length > 0) {
                await new sql.Request(transaction)
                    .input('game_id', sql.Int, gameId)
                    .query('DELETE FROM SteamGamePlatforms WHERE GameId = @game_id');
                for (const platformName of game.platforms) {
                    const platformId = await this.getOrCreatePlatform(platformName, transaction);
                    await new sql.Request(transaction)
                        .input('game_id', sql.Int, gameId)
                        .input('platform_id', sql.Int, platformId)
                        .query(`
                            INSERT INTO SteamGamePlatforms (game_id, platform_id)
                            SELECT @game_id, @platform_id
                            WHERE NOT EXISTS (
                                SELECT 1 FROM SteamGamePlatforms 
                                WHERE game_id = @game_id AND platform_id = @platform_id
                            )
                        `);
                }
            }

            if (game.genres && game.genres.length > 0) {
                await new sql.Request(transaction)
                    .input('game_id', sql.Int, gameId)
                    .query('DELETE FROM SteamGameGenres WHERE GameId = @game_id');
                for (const genreName of game.genres) {
                    const genreId = await this.getOrCreateGenre(genreName, transaction);
                    await new sql.Request(transaction)
                        .input('game_id', sql.Int, gameId)
                        .input('genre_id', sql.Int, genreId)
                        .query(`
                            INSERT INTO SteamGameGenres (game_id, genre_id)
                            SELECT @game_id, @genre_id
                            WHERE NOT EXISTS (
                                SELECT 1 FROM SteamGameGenres 
                                WHERE game_id = @game_id AND genre_id = @genre_id
                            )
                        `);
                }
            }

            if (game.categories && game.categories.length > 0) {
                await new sql.Request(transaction)
                    .input('game_id', sql.Int, gameId)
                    .query('DELETE FROM SteamGameCategories WHERE GameId = @game_id');
                for (const categoryName of game.categories) {
                    const categoryId = await this.getOrCreateCategory(categoryName, transaction);
                    await new sql.Request(transaction)
                        .input('game_id', sql.Int, gameId)
                        .input('category_id', sql.Int, categoryId)
                        .query(`
                            INSERT INTO SteamGameCategories (game_id, category_id)
                            SELECT @game_id, @category_id
                            WHERE NOT EXISTS (
                                SELECT 1 FROM SteamGameCategories 
                                WHERE game_id = @game_id AND category_id = @category_id
                            )
                        `);
                }
            }

            if (game.tags && game.tags.length > 0) {
                await new sql.Request(transaction)
                    .input('game_id', sql.Int, gameId)
                    .query('DELETE FROM SteamGameTags WHERE GameId = @game_id');
                for (const tagName of game.tags) {
                    const tagId = await this.getOrCreateTag(tagName, transaction);
                    await new sql.Request(transaction)
                        .input('game_id', sql.Int, gameId)
                        .input('tag_id', sql.Int, tagId)
                        .query(`
                            INSERT INTO SteamGameTags (game_id, tag_id)
                            SELECT @game_id, @tag_id
                            WHERE NOT EXISTS (
                                SELECT 1 FROM SteamGameTags 
                                WHERE game_id = @game_id AND tag_id = @tag_id
                            )
                        `);
                }
            }

            if (game.languages && game.languages.length > 0) {
                await new sql.Request(transaction)
                    .input('game_id', sql.Int, gameId)
                    .query('DELETE FROM SteamGameLanguages WHERE GameId = @game_id');
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
                            INSERT INTO SteamGameLanguages (game_id, language_id, has_interface, has_full_audio, has_subtitles)
                            SELECT @game_id, @language_id, @has_interface, @has_full_audio, @has_subtitles
                            WHERE NOT EXISTS (
                                SELECT 1 FROM SteamGameLanguages 
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
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error upserting game (steam_appid: ${game.steam_appid}, name: ${game.name}):`, errorMessage);
            throw new Error(`Failed to upsert game with steam_appid ${game.steam_appid}: ${errorMessage}`);
        }
    }

    // Achievement operations
    async upsertAchievement(achievement: Achievement): Promise<number> {
        // Validate input
        if (!achievement.game_id || achievement.game_id <= 0 || !Number.isInteger(achievement.game_id)) {
            throw new Error(`Invalid game_id: ${achievement.game_id}. Must be a positive integer.`);
        }
        if (!achievement.steam_apiname || typeof achievement.steam_apiname !== 'string' || achievement.steam_apiname.trim().length === 0) {
            throw new Error(`Invalid steam_apiname: ${achievement.steam_apiname}. Must be a non-empty string.`);
        }
        if (!achievement.name || typeof achievement.name !== 'string' || achievement.name.trim().length === 0) {
            throw new Error(`Invalid name: ${achievement.name}. Must be a non-empty string.`);
        }

        try {
            interface AchievementIdResult {
                id: number;
            }

            // Check if achievement exists (by game_id and steam_apiname)
            const checkResult = await this.pool.request()
                .input('game_id', sql.Int, achievement.game_id)
                .input('steam_apiname', sql.NVarChar(255), achievement.steam_apiname.trim())
                .query<AchievementIdResult>('SELECT TOP 1 Id as id FROM SteamAchievements WHERE GameId = @game_id AND SteamApiName = @steam_apiname');

            const existingAchievement = checkResult.recordset[0];

            if (existingAchievement) {
                // Update existing achievement - SQL will use created_at if last_updated is NULL
                await this.pool.request()
                    .input('id', sql.Int, existingAchievement.id)
                    .input('name', sql.NVarChar(255), achievement.name.trim())
                    .input('description', sql.NVarChar(2000), achievement.description?.trim() || null)
                    .input('icon_url', sql.NVarChar(500), achievement.icon_url?.trim() || null)
                    .input('points', sql.Int, achievement.points || null)
                    .input('is_hidden', sql.Bit, achievement.is_hidden || false)
                    .input('description_source', sql.NVarChar(50), achievement.description_source?.trim() || null)
                    .input('last_updated', sql.DateTime2, achievement.last_updated)
                    .query(`
                        UPDATE SteamAchievements SET
                            Name = @name,
                            Description = @description,
                            IconUrl = @icon_url,
                            Points = @points,
                            IsHidden = @is_hidden,
                            DescriptionSource = @description_source,
                            LastUpdated = COALESCE(@last_updated, CreateDate)
                        WHERE Id = @id
                    `);
                return existingAchievement.id;
            } else {
                // Insert new achievement - SQL will use GETDATE() if last_updated is NULL
                const insertResult = await this.pool.request()
                    .input('game_id', sql.Int, achievement.game_id)
                    .input('steam_apiname', sql.NVarChar(255), achievement.steam_apiname.trim())
                    .input('name', sql.NVarChar(255), achievement.name.trim())
                    .input('description', sql.NVarChar(2000), achievement.description?.trim() || null)
                    .input('icon_url', sql.NVarChar(500), achievement.icon_url?.trim() || null)
                    .input('points', sql.Int, achievement.points || null)
                    .input('is_hidden', sql.Bit, achievement.is_hidden || false)
                    .input('description_source', sql.NVarChar(50), achievement.description_source?.trim() || null)
                    .input('last_updated', sql.DateTime2, achievement.last_updated)
                    .query<{ id: number }>(`
                        INSERT INTO SteamAchievements (GameId, SteamApiName, Name, Description, IconUrl, Points, IsHidden,
                            DescriptionSource, LastUpdated)
                        OUTPUT INSERTED.Id as id
                        VALUES (@game_id, @steam_apiname, @name, @description, @icon_url, @points, @is_hidden,
                            @description_source, COALESCE(@last_updated, GETUTCDATE()))
                    `);
                return insertResult.recordset[0].id;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error upserting achievement (game_id: ${achievement.game_id}, steam_apiname: ${achievement.steam_apiname}):`, errorMessage);
            throw new Error(`Failed to upsert achievement for game_id ${achievement.game_id}, steam_apiname ${achievement.steam_apiname}: ${errorMessage}`);
        }
    }

    // User operations
    async upsertUser(user: User): Promise<number> {
        // Validate input
        if (!user.steam_id || typeof user.steam_id !== 'bigint' || user.steam_id <= 0n) {
            throw new Error(`Invalid steam_id: ${user.steam_id}. Must be a positive bigint.`);
        }
        if (!user.username || typeof user.username !== 'string' || user.username.trim().length === 0) {
            throw new Error(`Invalid username: ${user.username}. Must be a non-empty string.`);
        }

        try {
            interface UserIdResult {
                id: number;
            }

            // Check if user exists (only active users)
            const checkResult = await this.pool.request()
                .input('steam_id', sql.BigInt, user.steam_id)
                .query<UserIdResult>('SELECT TOP 1 Id as id FROM SteamUsers WHERE SteamId = @steam_id AND IsActive = 1');

            const existingUser = checkResult.recordset[0];

            if (existingUser) {
                // Update existing user
                await this.pool.request()
                    .input('id', sql.Int, existingUser.id)
                    .input('username', sql.NVarChar(255), user.username.trim())
                    .input('profile_url', sql.NVarChar(500), user.profile_url?.trim() || null)
                    .input('avatar_url', sql.NVarChar(500), user.avatar_url?.trim() || null)
                    .query(`
                        UPDATE SteamUsers SET
                            Username = @username,
                            ProfileUrl = @profile_url,
                            AvatarUrl = @avatar_url
                        WHERE Id = @id
                    `);
                return existingUser.id;
            } else {
                // Insert new user
                const insertResult = await this.pool.request()
                    .input('steam_id', sql.BigInt, user.steam_id)
                    .input('username', sql.NVarChar(255), user.username.trim())
                    .input('profile_url', sql.NVarChar(500), user.profile_url?.trim() || null)
                    .input('avatar_url', sql.NVarChar(500), user.avatar_url?.trim() || null)
                    .query<{ id: number }>(`
                        INSERT INTO SteamUsers (SteamId, Username, ProfileUrl, AvatarUrl, IsActive)
                        OUTPUT INSERTED.Id as id
                        VALUES (@steam_id, @username, @profile_url, @avatar_url, 1)
                    `);
                return insertResult.recordset[0].id;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error upserting user (steam_id: ${user.steam_id}, username: ${user.username}):`, errorMessage);
            throw new Error(`Failed to upsert user with steam_id ${user.steam_id}: ${errorMessage}`);
        }
    }

    // User achievement operations
    async upsertUserAchievement(userAchievement: UserAchievement): Promise<number> {
        // Validate inputs
        if (!userAchievement.user_id || userAchievement.user_id <= 0 || !Number.isInteger(userAchievement.user_id)) {
            throw new Error(`Invalid user_id: ${userAchievement.user_id}. Must be a positive integer.`);
        }
        if (!userAchievement.achievement_id || userAchievement.achievement_id <= 0 || !Number.isInteger(userAchievement.achievement_id)) {
            throw new Error(`Invalid achievement_id: ${userAchievement.achievement_id}. Must be a positive integer.`);
        }

        try {
            interface UserAchievementIdResult {
                id: number;
            }

            // Check if user achievement exists
            const checkResult = await this.pool.request()
                .input('user_id', sql.Int, userAchievement.user_id)
                .input('achievement_id', sql.Int, userAchievement.achievement_id)
                .query<UserAchievementIdResult>('SELECT TOP 1 Id as id FROM SteamUserAchievements WHERE UserId = @user_id AND AchievementId = @achievement_id');

            const existing = checkResult.recordset[0];

            if (existing) {
                // Update existing user achievement
                await this.pool.request()
                    .input('id', sql.Int, existing.id)
                    .input('unlocked_at', sql.DateTime2, userAchievement.unlocked_at)
                    .query(`
                        UPDATE SteamUserAchievements SET
                            UnlockedAt = @unlocked_at
                        WHERE Id = @id
                    `);
                return existing.id;
            } else {
                // Insert new user achievement
                const insertResult = await this.pool.request()
                    .input('user_id', sql.Int, userAchievement.user_id)
                    .input('achievement_id', sql.Int, userAchievement.achievement_id)
                    .input('unlocked_at', sql.DateTime2, userAchievement.unlocked_at)
                    .query<{ id: number }>(`
                        INSERT INTO SteamUserAchievements (UserId, AchievementId, UnlockedAt)
                        OUTPUT INSERTED.Id as id
                        VALUES (@user_id, @achievement_id, @unlocked_at)
                    `);
                return insertResult.recordset[0].id;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error upserting user achievement (user_id: ${userAchievement.user_id}, achievement_id: ${userAchievement.achievement_id}):`, errorMessage);
            throw new Error(`Failed to upsert user achievement for user_id ${userAchievement.user_id}, achievement_id ${userAchievement.achievement_id}: ${errorMessage}`);
        }
    }

    // Get game with achievements
    async getGameWithAchievements(steamAppId: number): Promise<GameWithAchievementsResult[]> {
        // Validate input
        if (!steamAppId || steamAppId <= 0 || !Number.isInteger(steamAppId)) {
            throw new Error(`Invalid steamAppId: ${steamAppId}. Must be a positive integer.`);
        }

        try {
            const result = await this.pool.request()
                .input('steam_appid', sql.Int, steamAppId)
                .query<GameWithAchievementsResult>(`
                    SELECT 
                        g.Id as id,
                        g.SteamAppId as steam_appid,
                        g.Name as name,
                        g.ReleaseDate as release_date,
                        g.HeaderImageUrl as header_image_url,
                        g.CreateDate as created_at,
                        g.UpdateDate as updated_at,
                        g.ShortDescription as short_description,
                        g.IsUnlisted as is_unlisted,
                        g.IsRemoved as is_removed,
                        g.MainStoryHours as main_story_hours,
                        g.MainSidesHours as main_sides_hours,
                        g.CompletionistHours as completionist_hours,
                        g.AllStylesHours as all_styles_hours,
                        g.Alias as alias,
                        g.ScoreRank as score_rank,
                        g.MinOwners as min_owners,
                        g.MaxOwners as max_owners,
                        g.PeakCcu as peak_ccu,
                        a.Id as achievement_id,
                        a.SteamApiName as steam_apiname,
                        a.Name as achievement_name,
                        a.Description as achievement_description,
                        a.IconUrl as achievement_icon,
                        a.Points as points,
                        a.IsHidden as is_hidden
                    FROM SteamGames g
                    LEFT JOIN SteamAchievements a ON g.Id = a.GameId
                    WHERE g.SteamAppId = @steam_appid
                    ORDER BY a.Points DESC, a.Name
                `);
            return result.recordset;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error getting game with achievements (steamAppId: ${steamAppId}):`, errorMessage);
            throw new Error(`Failed to get game with achievements for steamAppId ${steamAppId}: ${errorMessage}`);
        }
    }

    // Get user achievements for a game
    async getUserGameAchievements(userId: number, gameId: number): Promise<UserGameAchievementResult[]> {
        // Validate inputs
        if (!userId || userId <= 0 || !Number.isInteger(userId)) {
            throw new Error(`Invalid userId: ${userId}. Must be a positive integer.`);
        }
        if (!gameId || gameId <= 0 || !Number.isInteger(gameId)) {
            throw new Error(`Invalid gameId: ${gameId}. Must be a positive integer.`);
        }

        try {
            const result = await this.pool.request()
                .input('user_id', sql.Int, userId)
                .input('game_id', sql.Int, gameId)
                .query<UserGameAchievementResult>(`
                    SELECT 
                        a.Id as id,
                        a.GameId as game_id,
                        a.SteamApiName as steam_apiname,
                        a.Name as name,
                        a.Description as description,
                        a.IconUrl as icon_url,
                        a.Points as points,
                        a.IsHidden as is_hidden,
                        a.CreateDate as created_at,
                        a.DescriptionSource as description_source,
                        a.LastUpdated as last_updated,
                        ua.UnlockedAt as unlocked_at,
                        CAST(CASE WHEN ua.Id IS NOT NULL THEN 1 ELSE 0 END AS BIT) as is_unlocked
                    FROM SteamAchievements a
                    LEFT JOIN SteamUserAchievements ua ON a.Id = ua.AchievementId AND ua.UserId = @user_id
                    WHERE a.GameId = @game_id
                    ORDER BY a.Points DESC, a.Name
                `);
            return result.recordset;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error getting user game achievements (userId: ${userId}, gameId: ${gameId}):`, errorMessage);
            throw new Error(`Failed to get user game achievements for userId ${userId}, gameId ${gameId}: ${errorMessage}`);
        }
    }

    // Get achievements for a game
    async getGameAchievements(steamAppId: number): Promise<GameAchievementsResponse> {
        // Validate input
        if (!steamAppId || steamAppId <= 0 || !Number.isInteger(steamAppId)) {
            throw new Error(`Invalid steamAppId: ${steamAppId}. Must be a positive integer.`);
        }

        try {
            interface GameIdResult {
                Id: number;
            }

            // Check if game exists and get achievements in one query
            const result = await this.pool.request()
                .input('steam_appid', sql.Int, steamAppId)
                .query<GameAchievementResult & { GameIdCheck: number }>(`
                    SELECT 
                        a.Id as id,
                        a.GameId as game_id,
                        a.SteamApiName as steam_apiname,
                        a.Name as name,
                        a.Description as description,
                        a.IconUrl as icon_url,
                        a.Points as points,
                        a.IsHidden as is_hidden,
                        a.CreateDate as created_at,
                        a.DescriptionSource as description_source,
                        a.LastUpdated as last_updated,
                        g.Id as GameIdCheck
                    FROM SteamGames g
                    LEFT JOIN SteamAchievements a ON g.Id = a.GameId
                    WHERE g.SteamAppId = @steam_appid
                    ORDER BY 
                        CASE WHEN a.IsHidden IS NULL THEN 1 ELSE 0 END,
                        a.IsHidden ASC,
                        CASE WHEN a.Points IS NULL THEN 1 ELSE 0 END,
                        a.Points DESC,
                        CASE WHEN a.Name IS NULL THEN 1 ELSE 0 END,
                        a.Name ASC
                `);

            if (result.recordset.length === 0 || !result.recordset[0].GameIdCheck) {
                return {
                    gameExists: false,
                    achievements: []
                };
            }

            // Filter out null achievement rows (when game exists but has no achievements)
            const achievements = result.recordset
                .filter(row => row.id !== null)
                .map(({ GameIdCheck, ...achievement }) => achievement) as GameAchievementResult[];

            return {
                gameExists: true,
                achievements
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error getting game achievements (steamAppId: ${steamAppId}):`, errorMessage);
            throw new Error(`Failed to get game achievements for steamAppId ${steamAppId}: ${errorMessage}`);
        }
    }

    // Helper method to get game ID by steam_appid
    async getGameIdBySteamAppId(steamAppId: number): Promise<number | null> {
        // Validate input
        if (!steamAppId || steamAppId <= 0 || !Number.isInteger(steamAppId)) {
            throw new Error(`Invalid steamAppId: ${steamAppId}. Must be a positive integer.`);
        }

        try {
            interface GameIdResult {
                id: number;
            }

            const result = await this.pool.request()
                .input('steam_appid', sql.Int, steamAppId)
                .query<GameIdResult>('SELECT TOP 1 Id as id FROM SteamGames WHERE SteamAppId = @steam_appid');

            return result.recordset[0]?.id ?? null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error getting game ID by steam_appid (steamAppId: ${steamAppId}):`, errorMessage);
            throw new Error(`Failed to get game ID for steamAppId ${steamAppId}: ${errorMessage}`);
        }
    }

    // Helper method to get achievement ID by game_id and steam_apiname
    async getAchievementIdBySteamApiName(gameId: number, steamApiName: string): Promise<number | null> {
        // Validate and normalize inputs
        if (!gameId || gameId <= 0 || !Number.isInteger(gameId)) {
            throw new Error(`Invalid gameId: ${gameId}. Must be a positive integer.`);
        }
        if (!steamApiName || typeof steamApiName !== 'string' || steamApiName.trim().length === 0) {
            throw new Error(`Invalid steamApiName: ${steamApiName}. Must be a non-empty string.`);
        }
        const normalizedApiName = steamApiName.trim();

        try {
            interface AchievementIdResult {
                Id: number;
            }

            const result = await this.pool.request()
                .input('game_id', sql.Int, gameId)
                .input('steam_apiname', sql.NVarChar(255), normalizedApiName)
                .query<AchievementIdResult>('SELECT TOP 1 id FROM SteamAchievements WHERE game_id = @game_id AND steam_apiname = @steam_apiname');

            return result.recordset[0]?.Id ?? null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error getting achievement ID by steam_apiname (gameId: ${gameId}, steamApiName: ${steamApiName}):`, errorMessage);
            throw new Error(`Failed to get achievement ID for gameId ${gameId}, steamApiName ${steamApiName}: ${errorMessage}`);
        }
    }

    // User game operations
    async upsertUserGame(userGame: UserGame): Promise<number> {
        // Validate inputs
        if (!userGame.user_id || userGame.user_id <= 0 || !Number.isInteger(userGame.user_id)) {
            throw new Error(`Invalid user_id: ${userGame.user_id}. Must be a positive integer.`);
        }
        if (!userGame.game_id || userGame.game_id <= 0 || !Number.isInteger(userGame.game_id)) {
            throw new Error(`Invalid game_id: ${userGame.game_id}. Must be a positive integer.`);
        }
        if (userGame.playtime_forever < 0 || !Number.isInteger(userGame.playtime_forever)) {
            throw new Error(`Invalid playtime_forever: ${userGame.playtime_forever}. Must be a non-negative integer.`);
        }
        if (userGame.playtime_2weeks < 0 || !Number.isInteger(userGame.playtime_2weeks)) {
            throw new Error(`Invalid playtime_2weeks: ${userGame.playtime_2weeks}. Must be a non-negative integer.`);
        }

        try {
            interface UserGameIdResult {
                id: number;
            }

            // Check if user game exists
            const checkResult = await this.pool.request()
                .input('user_id', sql.Int, userGame.user_id)
                .input('game_id', sql.Int, userGame.game_id)
                .query<UserGameIdResult>('SELECT TOP 1 Id as id FROM SteamUserGames WHERE UserId = @user_id AND GameId = @game_id');

            const existing = checkResult.recordset[0];

            if (existing) {
                // Update existing user game
                await this.pool.request()
                    .input('id', sql.Int, existing.id)
                    .input('playtime_forever', sql.Int, userGame.playtime_forever)
                    .input('playtime_2weeks', sql.Int, userGame.playtime_2weeks)
                    .input('last_played_at', sql.DateTime2, userGame.last_played_at)
                    .query(`
                        UPDATE SteamUserGames SET
                            PlaytimeForever = @playtime_forever,
                            Playtime2Weeks = @playtime_2weeks,
                            LastPlayedAt = @last_played_at
                        WHERE Id = @id
                    `);
                return existing.id;
            } else {
                // Insert new user game
                const insertResult = await this.pool.request()
                    .input('user_id', sql.Int, userGame.user_id)
                    .input('game_id', sql.Int, userGame.game_id)
                    .input('playtime_forever', sql.Int, userGame.playtime_forever)
                    .input('playtime_2weeks', sql.Int, userGame.playtime_2weeks)
                    .input('last_played_at', sql.DateTime2, userGame.last_played_at)
                    .query<{ id: number }>(`
                        INSERT INTO SteamUserGames (UserId, GameId, PlaytimeForever, Playtime2Weeks, LastPlayedAt)
                        OUTPUT INSERTED.Id as id
                        VALUES (@user_id, @game_id, @playtime_forever, @playtime_2weeks, @last_played_at)
                    `);
                return insertResult.recordset[0].id;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error upserting user game (user_id: ${userGame.user_id}, game_id: ${userGame.game_id}):`, errorMessage);
            throw new Error(`Failed to upsert user game for user_id ${userGame.user_id}, game_id ${userGame.game_id}: ${errorMessage}`);
        }
    }

    // Soft delete user by setting is_active to false
    async deleteUserBySteamId(steamId: bigint): Promise<boolean> {
        // Validate input
        if (!steamId || typeof steamId !== 'bigint' || steamId <= 0n) {
            throw new Error(`Invalid steamId: ${steamId}. Must be a positive bigint.`);
        }

        const transaction = new sql.Transaction(this.pool);

        try {
            await transaction.begin();

            interface UserIdResult {
                id: number;
            }

            // Get the user ID - use parameterized query with BIGINT type
            const userResult = await new sql.Request(transaction)
                .input('steam_id', sql.BigInt, steamId)
                .query<UserIdResult>('SELECT TOP 1 Id as id FROM SteamUsers WHERE SteamId = @steam_id AND IsActive = 1');

            const user = userResult.recordset[0];
            if (!user) {
                await transaction.rollback();
                return false;
            }

            const userId = user.id;

            // Soft delete the user by setting is_active to false
            await new sql.Request(transaction)
                .input('user_id', sql.Int, userId)
                .query('UPDATE SteamUsers SET IsActive = 0 WHERE Id = @user_id');

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error soft deleting user (steamId: ${steamId}):`, errorMessage);
            throw new Error(`Failed to soft delete user with steamId ${steamId}: ${errorMessage}`);
        }
    }
}
