"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const mssql_1 = __importDefault(require("mssql"));
function normalizeText(value, label) {
    if (typeof value !== 'string') {
        throw new Error(`Invalid ${label}: ${String(value)}. Must be a string.`);
    }
    const trimmed = value.trim();
    if (!trimmed) {
        throw new Error(`Invalid ${label}: must be a non-empty string.`);
    }
    return trimmed;
}
function normalizeOptionalText(value) {
    if (value == null)
        return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
}
function uniqueNormalized(values, label) {
    const set = new Set();
    for (const v of values) {
        const norm = normalizeText(v, label);
        set.add(norm);
    }
    return [...set];
}
function parseOwnersStrict(owners) {
    if (!owners)
        return { min: null, max: null };
    const text = owners.trim();
    // Allowed:
    // - "123"
    // - "0 .. 20000" (with any amount of whitespace around '..')
    const range = text.match(/^(\d+)\s*\.\.\s*(\d+)$/);
    if (range) {
        return { min: parseInt(range[1], 10), max: parseInt(range[2], 10) };
    }
    const exact = text.match(/^(\d+)$/);
    if (exact) {
        const value = parseInt(exact[1], 10);
        return { min: value, max: value };
    }
    return { min: null, max: null };
}
class DatabaseService {
    constructor(pool) {
        this.pool = pool;
    }
    req(transaction) {
        return transaction ? new mssql_1.default.Request(transaction) : this.pool.request();
    }
    /**
     * Atomic get-or-create for (Table(Name)) style lookup tables.
     * Requires a unique constraint on Name (or Code for languages).
     */
    async getOrCreateByName(table, nameColumn, 
    // mssql's NVarChar(50) returns an ISqlTypeWithLength, not the factory type.
    // Accept any "sql type" that `.input()` can handle.
    nameType, name, transaction) {
        const normalized = normalizeText(name, 'name');
        // MERGE makes this atomic in SQL Server, preventing the SELECT-then-INSERT race.
        const result = await this.req(transaction)
            .input('name', nameType, normalized)
            .query(`
        MERGE ${table} WITH (HOLDLOCK) AS target
        USING (SELECT @name AS ${nameColumn}) AS source
          ON target.${nameColumn} = source.${nameColumn}
        WHEN NOT MATCHED THEN
          INSERT (${nameColumn}) VALUES (source.${nameColumn})
        OUTPUT inserted.Id as id;
      `);
        return result.recordset[0].id;
    }
    async getOrCreatePlatform(name, transaction) {
        return this.getOrCreateByName('SteamPlatforms', 'Name', mssql_1.default.NVarChar(50), name, transaction);
    }
    async getOrCreateGenre(name, transaction) {
        return this.getOrCreateByName('SteamGenres', 'Name', mssql_1.default.NVarChar(100), name, transaction);
    }
    async getOrCreateCategory(name, transaction) {
        return this.getOrCreateByName('SteamCategories', 'Name', mssql_1.default.NVarChar(100), name, transaction);
    }
    async getOrCreateTag(name, transaction) {
        return this.getOrCreateByName('SteamTags', 'Name', mssql_1.default.NVarChar(100), name, transaction);
    }
    async getOrCreateDeveloper(name, transaction) {
        return this.getOrCreateByName('SteamDevelopers', 'Name', mssql_1.default.NVarChar(255), name, transaction);
    }
    async getOrCreatePublisher(name, transaction) {
        return this.getOrCreateByName('SteamPublishers', 'Name', mssql_1.default.NVarChar(255), name, transaction);
    }
    async getOrCreateLanguage(code, name, transaction) {
        const normalizedCode = normalizeText(code, 'code');
        const normalizedName = normalizeOptionalText(name) ?? normalizedCode;
        const result = await this.req(transaction)
            .input('code', mssql_1.default.NVarChar(10), normalizedCode)
            .input('name', mssql_1.default.NVarChar(100), normalizedName)
            .query(`
        MERGE SteamLanguages WITH (HOLDLOCK) AS target
        USING (SELECT @code AS Code, @name AS Name) AS source
          ON target.Code = source.Code
        WHEN NOT MATCHED THEN
          INSERT (Code, Name) VALUES (source.Code, source.Name)
        WHEN MATCHED AND (target.Name IS NULL OR target.Name = '') THEN
          UPDATE SET Name = source.Name
        OUTPUT inserted.Id as id;
      `);
        return result.recordset[0].id;
    }
    // Relationship management methods (still name-based for now, but de-duped + transaction-aware)
    async setGamePlatforms(gameId, platformNames, transaction) {
        const names = uniqueNormalized(platformNames, 'platform');
        await this.req(transaction).input('game_id', mssql_1.default.Int, gameId).query('DELETE FROM SteamGamePlatforms WHERE GameId = @game_id');
        for (const platformName of names) {
            const platformId = await this.getOrCreatePlatform(platformName, transaction);
            await this.req(transaction)
                .input('game_id', mssql_1.default.Int, gameId)
                .input('platform_id', mssql_1.default.Int, platformId)
                .query('INSERT INTO SteamGamePlatforms (GameId, PlatformId) VALUES (@game_id, @platform_id)');
        }
    }
    async setGameGenres(gameId, genreNames, transaction) {
        const names = uniqueNormalized(genreNames, 'genre');
        await this.req(transaction).input('game_id', mssql_1.default.Int, gameId).query('DELETE FROM SteamGameGenres WHERE GameId = @game_id');
        for (const genreName of names) {
            const genreId = await this.getOrCreateGenre(genreName, transaction);
            await this.req(transaction)
                .input('game_id', mssql_1.default.Int, gameId)
                .input('genre_id', mssql_1.default.Int, genreId)
                .query('INSERT INTO SteamGameGenres (GameId, GenreId) VALUES (@game_id, @genre_id)');
        }
    }
    async setGameCategories(gameId, categoryNames, transaction) {
        const names = uniqueNormalized(categoryNames, 'category');
        await this.req(transaction).input('game_id', mssql_1.default.Int, gameId).query('DELETE FROM SteamGameCategories WHERE GameId = @game_id');
        for (const categoryName of names) {
            const categoryId = await this.getOrCreateCategory(categoryName, transaction);
            await this.req(transaction)
                .input('game_id', mssql_1.default.Int, gameId)
                .input('category_id', mssql_1.default.Int, categoryId)
                .query('INSERT INTO SteamGameCategories (GameId, CategoryId) VALUES (@game_id, @category_id)');
        }
    }
    async setGameTags(gameId, tagNames, transaction) {
        const names = uniqueNormalized(tagNames, 'tag');
        await this.req(transaction).input('game_id', mssql_1.default.Int, gameId).query('DELETE FROM SteamGameTags WHERE GameId = @game_id');
        for (const tagName of names) {
            const tagId = await this.getOrCreateTag(tagName, transaction);
            await this.req(transaction)
                .input('game_id', mssql_1.default.Int, gameId)
                .input('tag_id', mssql_1.default.Int, tagId)
                .query('INSERT INTO SteamGameTags (GameId, TagId) VALUES (@game_id, @tag_id)');
        }
    }
    async setGameDevelopers(gameId, developerNames, transaction) {
        const names = uniqueNormalized(developerNames, 'developer');
        await this.req(transaction).input('game_id', mssql_1.default.Int, gameId).query('DELETE FROM SteamGameDevelopers WHERE GameId = @game_id');
        for (const developerName of names) {
            const developerId = await this.getOrCreateDeveloper(developerName, transaction);
            await this.req(transaction)
                .input('game_id', mssql_1.default.Int, gameId)
                .input('developer_id', mssql_1.default.Int, developerId)
                .query('INSERT INTO SteamGameDevelopers (GameId, DeveloperId) VALUES (@game_id, @developer_id)');
        }
    }
    async setGamePublishers(gameId, publisherNames, transaction) {
        const names = uniqueNormalized(publisherNames, 'publisher');
        await this.req(transaction).input('game_id', mssql_1.default.Int, gameId).query('DELETE FROM SteamGamePublishers WHERE GameId = @game_id');
        for (const publisherName of names) {
            const publisherId = await this.getOrCreatePublisher(publisherName, transaction);
            await this.req(transaction)
                .input('game_id', mssql_1.default.Int, gameId)
                .input('publisher_id', mssql_1.default.Int, publisherId)
                .query('INSERT INTO SteamGamePublishers (GameId, PublisherId) VALUES (@game_id, @publisher_id)');
        }
    }
    async setGameLanguages(gameId, languages, transaction) {
        await this.req(transaction).input('game_id', mssql_1.default.Int, gameId).query('DELETE FROM SteamGameLanguages WHERE GameId = @game_id');
        // Normalize to a single internal shape
        const normalized = [];
        for (const lang of languages) {
            if (typeof lang === 'string') {
                normalized.push({ code: normalizeText(lang, 'language code'), has_interface: false, has_full_audio: false, has_subtitles: false });
            }
            else {
                if (!lang.code)
                    throw new Error('GameLanguageSupport must include code');
                normalized.push({
                    code: normalizeText(lang.code, 'language code'),
                    has_interface: lang.has_interface ?? false,
                    has_full_audio: lang.has_full_audio ?? false,
                    has_subtitles: lang.has_subtitles ?? false,
                });
            }
        }
        // De-dupe by full shape (code + support flags)
        const seen = new Set();
        for (const item of normalized) {
            const key = `${item.code}|${item.has_interface ? 1 : 0}|${item.has_full_audio ? 1 : 0}|${item.has_subtitles ? 1 : 0}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            const languageId = await this.getOrCreateLanguage(item.code, undefined, transaction);
            await this.req(transaction)
                .input('game_id', mssql_1.default.Int, gameId)
                .input('language_id', mssql_1.default.Int, languageId)
                .input('has_interface', mssql_1.default.Bit, item.has_interface)
                .input('has_full_audio', mssql_1.default.Bit, item.has_full_audio)
                .input('has_subtitles', mssql_1.default.Bit, item.has_subtitles)
                .query('INSERT INTO SteamGameLanguages (GameId, LanguageId, HasInterface, HasFullAudio, HasSubtitles) VALUES (@game_id, @language_id, @has_interface, @has_full_audio, @has_subtitles)');
        }
    }
    // Game operations
    async upsertGame(game) {
        if (!game.steam_appid || game.steam_appid <= 0 || !Number.isInteger(game.steam_appid)) {
            throw new Error(`Invalid steam_appid: ${game.steam_appid}. Must be a positive integer.`);
        }
        const gameName = normalizeText(game.name, 'name');
        // Parse owners from legacy "owners" string if min/max not provided
        let minOwners = game.min_owners ?? undefined;
        let maxOwners = game.max_owners ?? undefined;
        if (game.min_owners === undefined && game.max_owners === undefined) {
            const legacyOwners = game.owners;
            const parsed = parseOwnersStrict(legacyOwners);
            if (parsed.min !== null && parsed.max !== null) {
                minOwners = parsed.min;
                maxOwners = parsed.max;
            }
        }
        // Normalize languages into a single shape for the stored procedure
        const languagesJson = game.languages == null
            ? null
            : JSON.stringify((() => {
                const out = [];
                for (const lang of game.languages ?? []) {
                    if (typeof lang === 'string') {
                        out.push({ code: normalizeText(lang, 'language code'), has_interface: false, has_full_audio: false, has_subtitles: false });
                    }
                    else {
                        if (!lang.code)
                            throw new Error('GameLanguageSupport must include code');
                        out.push({
                            code: normalizeText(lang.code, 'language code'),
                            has_interface: lang.has_interface ?? false,
                            has_full_audio: lang.has_full_audio ?? false,
                            has_subtitles: lang.has_subtitles ?? false,
                        });
                    }
                }
                return out;
            })());
        const result = await this.pool
            .request()
            .input('SteamAppId', mssql_1.default.Int, game.steam_appid)
            .input('Name', mssql_1.default.NVarChar(255), gameName)
            .input('ReleaseDate', mssql_1.default.Date, game.release_date ?? null)
            .input('HeaderImageUrl', mssql_1.default.NVarChar(500), normalizeOptionalText(game.header_image_url))
            .input('ShortDescription', mssql_1.default.NVarChar(2000), normalizeOptionalText(game.short_description))
            .input('IsUnlisted', mssql_1.default.Bit, game.is_unlisted ?? false)
            .input('IsRemoved', mssql_1.default.Bit, game.is_removed ?? false)
            .input('MainStoryHours', mssql_1.default.Decimal(10, 2), game.main_story_hours ?? null)
            .input('MainSidesHours', mssql_1.default.Decimal(10, 2), game.main_sides_hours ?? null)
            .input('CompletionistHours', mssql_1.default.Decimal(10, 2), game.completionist_hours ?? null)
            .input('AllStylesHours', mssql_1.default.Decimal(10, 2), game.all_styles_hours ?? null)
            .input('Alias', mssql_1.default.NVarChar(255), normalizeOptionalText(game.alias))
            .input('ScoreRank', mssql_1.default.Int, game.score_rank ?? null)
            .input('MinOwners', mssql_1.default.Int, minOwners ?? null)
            .input('MaxOwners', mssql_1.default.Int, maxOwners ?? null)
            .input('PeakCcu', mssql_1.default.Int, game.peak_ccu ?? null)
            .input('PlatformsJson', mssql_1.default.NVarChar(mssql_1.default.MAX), game.platforms ? JSON.stringify(uniqueNormalized(game.platforms, 'platform')) : null)
            .input('GenresJson', mssql_1.default.NVarChar(mssql_1.default.MAX), game.genres ? JSON.stringify(uniqueNormalized(game.genres, 'genre')) : null)
            .input('CategoriesJson', mssql_1.default.NVarChar(mssql_1.default.MAX), game.categories ? JSON.stringify(uniqueNormalized(game.categories, 'category')) : null)
            .input('TagsJson', mssql_1.default.NVarChar(mssql_1.default.MAX), game.tags ? JSON.stringify(uniqueNormalized(game.tags, 'tag')) : null)
            .input('DevelopersJson', mssql_1.default.NVarChar(mssql_1.default.MAX), game.developers ? JSON.stringify(uniqueNormalized(game.developers, 'developer')) : null)
            .input('PublishersJson', mssql_1.default.NVarChar(mssql_1.default.MAX), game.publishers ? JSON.stringify(uniqueNormalized(game.publishers, 'publisher')) : null)
            .input('LanguagesJson', mssql_1.default.NVarChar(mssql_1.default.MAX), languagesJson)
            .execute('dbo.UpsertSteamGame');
        const id = result.recordset?.[0]?.Id;
        if (!id)
            throw new Error(`dbo.UpsertSteamGame did not return an Id for steam_appid ${game.steam_appid}`);
        return id;
    }
    // Achievement operations
    async upsertAchievement(achievement) {
        if (!achievement.game_id || achievement.game_id <= 0 || !Number.isInteger(achievement.game_id)) {
            throw new Error(`Invalid game_id: ${achievement.game_id}. Must be a positive integer.`);
        }
        const apiName = normalizeText(achievement.steam_apiname, 'steam_apiname');
        const name = normalizeText(achievement.name, 'name');
        const result = await this.pool
            .request()
            .input('GameId', mssql_1.default.Int, achievement.game_id)
            .input('SteamApiName', mssql_1.default.NVarChar(255), apiName)
            .input('Name', mssql_1.default.NVarChar(255), name)
            .input('Description', mssql_1.default.NVarChar(2000), normalizeOptionalText(achievement.description))
            .input('IconUrl', mssql_1.default.NVarChar(500), normalizeOptionalText(achievement.icon_url))
            .input('Points', mssql_1.default.Int, achievement.points ?? null)
            .input('IsHidden', mssql_1.default.Bit, achievement.is_hidden ?? false)
            .input('DescriptionSource', mssql_1.default.NVarChar(50), normalizeOptionalText(achievement.description_source))
            .input('LastUpdated', mssql_1.default.DateTime2, achievement.last_updated ?? null)
            .execute('dbo.UpsertSteamAchievement');
        const id = result.recordset?.[0]?.Id;
        if (!id)
            throw new Error(`dbo.UpsertSteamAchievement did not return an Id for game_id ${achievement.game_id}`);
        return id;
    }
    // User operations
    async upsertUser(user) {
        if (!user.steam_id || typeof user.steam_id !== 'bigint' || user.steam_id <= 0n) {
            throw new Error(`Invalid steam_id: ${String(user.steam_id)}. Must be a positive bigint.`);
        }
        const username = normalizeText(user.username, 'username');
        const result = await this.pool
            .request()
            .input('SteamId', mssql_1.default.BigInt, user.steam_id)
            .input('Username', mssql_1.default.NVarChar(255), username)
            .input('ProfileUrl', mssql_1.default.NVarChar(500), normalizeOptionalText(user.profile_url))
            .input('AvatarUrl', mssql_1.default.NVarChar(500), normalizeOptionalText(user.avatar_url))
            .execute('dbo.UpsertSteamUser');
        const id = result.recordset?.[0]?.Id;
        if (!id)
            throw new Error(`dbo.UpsertSteamUser did not return an Id for steam_id ${String(user.steam_id)}`);
        return id;
    }
    // User achievement operations
    async upsertUserAchievement(userAchievement) {
        if (!userAchievement.user_id || userAchievement.user_id <= 0 || !Number.isInteger(userAchievement.user_id)) {
            throw new Error(`Invalid user_id: ${userAchievement.user_id}. Must be a positive integer.`);
        }
        if (!userAchievement.achievement_id || userAchievement.achievement_id <= 0 || !Number.isInteger(userAchievement.achievement_id)) {
            throw new Error(`Invalid achievement_id: ${userAchievement.achievement_id}. Must be a positive integer.`);
        }
        const result = await this.pool
            .request()
            .input('UserId', mssql_1.default.Int, userAchievement.user_id)
            .input('AchievementId', mssql_1.default.Int, userAchievement.achievement_id)
            .input('UnlockedAt', mssql_1.default.DateTime2, userAchievement.unlocked_at ?? null)
            .execute('dbo.UpsertSteamUserAchievement');
        const id = result.recordset?.[0]?.Id;
        if (!id)
            throw new Error(`dbo.UpsertSteamUserAchievement did not return an Id for user_id ${userAchievement.user_id}`);
        return id;
    }
    // Get game with achievements
    async getGameWithAchievements(steamAppId) {
        if (!steamAppId || steamAppId <= 0 || !Number.isInteger(steamAppId)) {
            throw new Error(`Invalid steamAppId: ${steamAppId}. Must be a positive integer.`);
        }
        const result = await this.pool
            .request()
            .input('SteamAppId', mssql_1.default.Int, steamAppId)
            .execute('dbo.GetSteamGameWithAchievements');
        return result.recordset ?? [];
    }
    // Get user achievements for a game
    async getUserGameAchievements(userId, gameId) {
        if (!userId || userId <= 0 || !Number.isInteger(userId)) {
            throw new Error(`Invalid userId: ${userId}. Must be a positive integer.`);
        }
        if (!gameId || gameId <= 0 || !Number.isInteger(gameId)) {
            throw new Error(`Invalid gameId: ${gameId}. Must be a positive integer.`);
        }
        const result = await this.pool
            .request()
            .input('UserId', mssql_1.default.Int, userId)
            .input('GameId', mssql_1.default.Int, gameId)
            .execute('dbo.GetSteamUserGameAchievements');
        return result.recordset ?? [];
    }
    // Get achievements for a game
    async getGameAchievements(steamAppId) {
        if (!steamAppId || steamAppId <= 0 || !Number.isInteger(steamAppId)) {
            throw new Error(`Invalid steamAppId: ${steamAppId}. Must be a positive integer.`);
        }
        const result = await this.pool
            .request()
            .input('SteamAppId', mssql_1.default.Int, steamAppId)
            .execute('dbo.GetSteamGameAchievements');
        if (result.recordset.length === 0 || !result.recordset[0].GameIdCheck) {
            return { gameExists: false, achievements: [] };
        }
        const rows = (result.recordset ?? []);
        const achievements = rows
            .filter((row) => !!row && row.id !== null)
            .map(({ GameIdCheck: _gameIdCheck, ...achievement }) => achievement);
        return { gameExists: true, achievements };
    }
    // Helper method to get game ID by steam_appid
    async getGameIdBySteamAppId(steamAppId) {
        if (!steamAppId || steamAppId <= 0 || !Number.isInteger(steamAppId)) {
            throw new Error(`Invalid steamAppId: ${steamAppId}. Must be a positive integer.`);
        }
        const result = await this.pool
            .request()
            .input('SteamAppId', mssql_1.default.Int, steamAppId)
            .execute('dbo.GetSteamGameIdBySteamAppId');
        return result.recordset?.[0]?.id ?? null;
    }
    // Helper method to get achievement ID by game_id and steam_apiname
    async getAchievementIdBySteamApiName(gameId, steamApiName) {
        if (!gameId || gameId <= 0 || !Number.isInteger(gameId)) {
            throw new Error(`Invalid gameId: ${gameId}. Must be a positive integer.`);
        }
        const normalizedApiName = normalizeText(steamApiName, 'steamApiName');
        const result = await this.pool
            .request()
            .input('GameId', mssql_1.default.Int, gameId)
            .input('SteamApiName', mssql_1.default.NVarChar(255), normalizedApiName)
            .execute('dbo.GetSteamAchievementIdByApiName');
        return result.recordset?.[0]?.id ?? null;
    }
    // User game operations
    async upsertUserGame(userGame) {
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
        const result = await this.pool
            .request()
            .input('UserId', mssql_1.default.Int, userGame.user_id)
            .input('GameId', mssql_1.default.Int, userGame.game_id)
            .input('PlaytimeForever', mssql_1.default.Int, userGame.playtime_forever)
            .input('Playtime2Weeks', mssql_1.default.Int, userGame.playtime_2weeks)
            .input('LastPlayedAt', mssql_1.default.DateTime2, userGame.last_played_at ?? null)
            .execute('dbo.UpsertSteamUserGame');
        const id = result.recordset?.[0]?.Id;
        if (!id)
            throw new Error(`dbo.UpsertSteamUserGame did not return an Id for user_id ${userGame.user_id}`);
        return id;
    }
    // Soft delete user by setting is_active to false
    async deleteUserBySteamId(steamId) {
        if (!steamId || typeof steamId !== 'bigint' || steamId <= 0n) {
            throw new Error(`Invalid steamId: ${String(steamId)}. Must be a positive bigint.`);
        }
        const transaction = new mssql_1.default.Transaction(this.pool);
        let began = false;
        try {
            await transaction.begin();
            began = true;
            const userResult = await this.req(transaction)
                .input('steam_id', mssql_1.default.BigInt, steamId)
                .query('SELECT TOP 1 Id as id FROM SteamUsers WHERE SteamId = @steam_id AND IsActive = 1');
            const user = userResult.recordset[0];
            if (!user) {
                await transaction.rollback();
                return false;
            }
            await this.req(transaction).input('user_id', mssql_1.default.Int, user.id).query('UPDATE SteamUsers SET IsActive = 0 WHERE Id = @user_id');
            await transaction.commit();
            return true;
        }
        catch (error) {
            if (began) {
                try {
                    await transaction.rollback();
                }
                catch {
                    // preserve original error
                }
            }
            const msg = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to soft delete user with steamId ${String(steamId)}: ${msg}`);
        }
    }
}
exports.DatabaseService = DatabaseService;
