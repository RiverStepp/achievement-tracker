import sql, { ConnectionPool } from 'mssql';
import type {
  Achievement,
  Game,
  GameAchievementResult,
  GameAchievementsResponse,
  GameLanguageSupport,
  GameWithAchievementsResult,
  User,
  UserAchievement,
  UserGame,
  UserGameAchievementResult,
} from './models';

type Tx = sql.Transaction;

function normalizeText(value: string, label: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Invalid ${label}: ${String(value)}. Must be a string.`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`Invalid ${label}: must be a non-empty string.`);
  }
  return trimmed;
}

function normalizeOptionalText(value: string | undefined | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function uniqueNormalized(values: string[], label: string): string[] {
  const set = new Set<string>();
  for (const v of values) {
    const norm = normalizeText(v, label);
    set.add(norm);
  }
  return [...set];
}

function parseOwnersStrict(owners: string | undefined): { min: number | null; max: number | null } {
  if (!owners) return { min: null, max: null };
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

export class DatabaseService {
  private pool: ConnectionPool;

  constructor(pool: ConnectionPool) {
    this.pool = pool;
  }

  private req(transaction?: Tx): sql.Request {
    return transaction ? new sql.Request(transaction) : this.pool.request();
  }

  /**
   * Atomic get-or-create for (Table(Name)) style lookup tables.
   * Requires a unique constraint on Name (or Code for languages).
   */
  private async getOrCreateByName(
    table: string,
    nameColumn: string,
    // mssql's NVarChar(50) returns an ISqlTypeWithLength, not the factory type.
    // Accept any "sql type" that `.input()` can handle.
    nameType: sql.ISqlType,
    name: string,
    transaction?: Tx,
  ): Promise<number> {
    const normalized = normalizeText(name, 'name');
    interface Row {
      id: number;
    }

    // MERGE makes this atomic in SQL Server, preventing the SELECT-then-INSERT race.
    const result = await this.req(transaction)
      .input('name', nameType, normalized)
      .query<Row>(`
        MERGE ${table} WITH (HOLDLOCK) AS target
        USING (SELECT @name AS ${nameColumn}) AS source
          ON target.${nameColumn} = source.${nameColumn}
        WHEN NOT MATCHED THEN
          INSERT (${nameColumn}) VALUES (source.${nameColumn})
        OUTPUT inserted.Id as id;
      `);

    return result.recordset[0].id;
  }

  async getOrCreatePlatform(name: string, transaction?: Tx): Promise<number> {
    return this.getOrCreateByName('SteamPlatforms', 'Name', sql.NVarChar(50), name, transaction);
  }

  async getOrCreateGenre(name: string, transaction?: Tx): Promise<number> {
    return this.getOrCreateByName('SteamGenres', 'Name', sql.NVarChar(100), name, transaction);
  }

  async getOrCreateCategory(name: string, transaction?: Tx): Promise<number> {
    return this.getOrCreateByName('SteamCategories', 'Name', sql.NVarChar(100), name, transaction);
  }

  async getOrCreateTag(name: string, transaction?: Tx): Promise<number> {
    return this.getOrCreateByName('SteamTags', 'Name', sql.NVarChar(100), name, transaction);
  }

  async getOrCreateDeveloper(name: string, transaction?: Tx): Promise<number> {
    return this.getOrCreateByName('SteamDevelopers', 'Name', sql.NVarChar(255), name, transaction);
  }

  async getOrCreatePublisher(name: string, transaction?: Tx): Promise<number> {
    return this.getOrCreateByName('SteamPublishers', 'Name', sql.NVarChar(255), name, transaction);
  }

  async getOrCreateLanguage(code: string, name?: string, transaction?: Tx): Promise<number> {
    const normalizedCode = normalizeText(code, 'code');
    const normalizedName = normalizeOptionalText(name) ?? normalizedCode;
    interface Row {
      id: number;
    }

    const result = await this.req(transaction)
      .input('code', sql.NVarChar(10), normalizedCode)
      .input('name', sql.NVarChar(100), normalizedName)
      .query<Row>(`
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
  async setGamePlatforms(gameId: number, platformNames: string[], transaction?: Tx): Promise<void> {
    const names = uniqueNormalized(platformNames, 'platform');
    await this.req(transaction).input('game_id', sql.Int, gameId).query('DELETE FROM SteamGamePlatforms WHERE GameId = @game_id');
    for (const platformName of names) {
      const platformId = await this.getOrCreatePlatform(platformName, transaction);
      await this.req(transaction)
        .input('game_id', sql.Int, gameId)
        .input('platform_id', sql.Int, platformId)
        .query('INSERT INTO SteamGamePlatforms (GameId, PlatformId) VALUES (@game_id, @platform_id)');
    }
  }

  async setGameGenres(gameId: number, genreNames: string[], transaction?: Tx): Promise<void> {
    const names = uniqueNormalized(genreNames, 'genre');
    await this.req(transaction).input('game_id', sql.Int, gameId).query('DELETE FROM SteamGameGenres WHERE GameId = @game_id');
    for (const genreName of names) {
      const genreId = await this.getOrCreateGenre(genreName, transaction);
      await this.req(transaction)
        .input('game_id', sql.Int, gameId)
        .input('genre_id', sql.Int, genreId)
        .query('INSERT INTO SteamGameGenres (GameId, GenreId) VALUES (@game_id, @genre_id)');
    }
  }

  async setGameCategories(gameId: number, categoryNames: string[], transaction?: Tx): Promise<void> {
    const names = uniqueNormalized(categoryNames, 'category');
    await this.req(transaction).input('game_id', sql.Int, gameId).query('DELETE FROM SteamGameCategories WHERE GameId = @game_id');
    for (const categoryName of names) {
      const categoryId = await this.getOrCreateCategory(categoryName, transaction);
      await this.req(transaction)
        .input('game_id', sql.Int, gameId)
        .input('category_id', sql.Int, categoryId)
        .query('INSERT INTO SteamGameCategories (GameId, CategoryId) VALUES (@game_id, @category_id)');
    }
  }

  async setGameTags(gameId: number, tagNames: string[], transaction?: Tx): Promise<void> {
    const names = uniqueNormalized(tagNames, 'tag');
    await this.req(transaction).input('game_id', sql.Int, gameId).query('DELETE FROM SteamGameTags WHERE GameId = @game_id');
    for (const tagName of names) {
      const tagId = await this.getOrCreateTag(tagName, transaction);
      await this.req(transaction)
        .input('game_id', sql.Int, gameId)
        .input('tag_id', sql.Int, tagId)
        .query('INSERT INTO SteamGameTags (GameId, TagId) VALUES (@game_id, @tag_id)');
    }
  }

  async setGameDevelopers(gameId: number, developerNames: string[], transaction?: Tx): Promise<void> {
    const names = uniqueNormalized(developerNames, 'developer');
    await this.req(transaction).input('game_id', sql.Int, gameId).query('DELETE FROM SteamGameDevelopers WHERE GameId = @game_id');
    for (const developerName of names) {
      const developerId = await this.getOrCreateDeveloper(developerName, transaction);
      await this.req(transaction)
        .input('game_id', sql.Int, gameId)
        .input('developer_id', sql.Int, developerId)
        .query('INSERT INTO SteamGameDevelopers (GameId, DeveloperId) VALUES (@game_id, @developer_id)');
    }
  }

  async setGamePublishers(gameId: number, publisherNames: string[], transaction?: Tx): Promise<void> {
    const names = uniqueNormalized(publisherNames, 'publisher');
    await this.req(transaction).input('game_id', sql.Int, gameId).query('DELETE FROM SteamGamePublishers WHERE GameId = @game_id');
    for (const publisherName of names) {
      const publisherId = await this.getOrCreatePublisher(publisherName, transaction);
      await this.req(transaction)
        .input('game_id', sql.Int, gameId)
        .input('publisher_id', sql.Int, publisherId)
        .query('INSERT INTO SteamGamePublishers (GameId, PublisherId) VALUES (@game_id, @publisher_id)');
    }
  }

  async setGameLanguages(gameId: number, languages: GameLanguageSupport[] | string[], transaction?: Tx): Promise<void> {
    await this.req(transaction).input('game_id', sql.Int, gameId).query('DELETE FROM SteamGameLanguages WHERE GameId = @game_id');

    // Normalize to a single internal shape
    const normalized: Array<{ code: string; has_interface: boolean; has_full_audio: boolean; has_subtitles: boolean }> = [];
    for (const lang of languages) {
      if (typeof lang === 'string') {
        normalized.push({ code: normalizeText(lang, 'language code'), has_interface: false, has_full_audio: false, has_subtitles: false });
      } else {
        if (!lang.code) throw new Error('GameLanguageSupport must include code');
        normalized.push({
          code: normalizeText(lang.code, 'language code'),
          has_interface: lang.has_interface ?? false,
          has_full_audio: lang.has_full_audio ?? false,
          has_subtitles: lang.has_subtitles ?? false,
        });
      }
    }

    // De-dupe by full shape (code + support flags)
    const seen = new Set<string>();
    for (const item of normalized) {
      const key = `${item.code}|${item.has_interface ? 1 : 0}|${item.has_full_audio ? 1 : 0}|${item.has_subtitles ? 1 : 0}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const languageId = await this.getOrCreateLanguage(item.code, undefined, transaction);
      await this.req(transaction)
        .input('game_id', sql.Int, gameId)
        .input('language_id', sql.Int, languageId)
        .input('has_interface', sql.Bit, item.has_interface)
        .input('has_full_audio', sql.Bit, item.has_full_audio)
        .input('has_subtitles', sql.Bit, item.has_subtitles)
        .query(
          'INSERT INTO SteamGameLanguages (GameId, LanguageId, HasInterface, HasFullAudio, HasSubtitles) VALUES (@game_id, @language_id, @has_interface, @has_full_audio, @has_subtitles)',
        );
    }
  }

  // Game operations
  async upsertGame(game: Game): Promise<number> {
    if (!game.steam_appid || game.steam_appid <= 0 || !Number.isInteger(game.steam_appid)) {
      throw new Error(`Invalid steam_appid: ${game.steam_appid}. Must be a positive integer.`);
    }
    const gameName = normalizeText(game.name, 'name');

    // Parse owners from legacy "owners" string if min/max not provided
    let minOwners = game.min_owners ?? undefined;
    let maxOwners = game.max_owners ?? undefined;
    if (game.min_owners === undefined && game.max_owners === undefined) {
      interface GameWithLegacyOwners extends Game {
        owners?: string;
      }
      const legacyOwners = (game as GameWithLegacyOwners).owners;
      const parsed = parseOwnersStrict(legacyOwners);
      if (parsed.min !== null && parsed.max !== null) {
        minOwners = parsed.min;
        maxOwners = parsed.max;
      }
    }

    // Normalize languages into a single shape for the stored procedure
    const languagesJson =
      game.languages == null
        ? null
        : JSON.stringify(
            ((): Array<{ code: string; has_interface: boolean; has_full_audio: boolean; has_subtitles: boolean }> => {
              const out: Array<{ code: string; has_interface: boolean; has_full_audio: boolean; has_subtitles: boolean }> = [];
              for (const lang of game.languages ?? []) {
                if (typeof lang === 'string') {
                  out.push({ code: normalizeText(lang, 'language code'), has_interface: false, has_full_audio: false, has_subtitles: false });
                } else {
                  if (!lang.code) throw new Error('GameLanguageSupport must include code');
                  out.push({
                    code: normalizeText(lang.code, 'language code'),
                    has_interface: lang.has_interface ?? false,
                    has_full_audio: lang.has_full_audio ?? false,
                    has_subtitles: lang.has_subtitles ?? false,
                  });
                }
              }
              return out;
            })(),
          );

    const result = await this.pool
      .request()
      .input('SteamAppId', sql.Int, game.steam_appid)
      .input('Name', sql.NVarChar(255), gameName)
      .input('ReleaseDate', sql.Date, game.release_date ?? null)
      .input('HeaderImageUrl', sql.NVarChar(500), normalizeOptionalText(game.header_image_url))
      .input('ShortDescription', sql.NVarChar(2000), normalizeOptionalText(game.short_description))
      .input('IsUnlisted', sql.Bit, game.is_unlisted ?? false)
      .input('IsRemoved', sql.Bit, game.is_removed ?? false)
      .input('MainStoryHours', sql.Decimal(10, 2), game.main_story_hours ?? null)
      .input('MainSidesHours', sql.Decimal(10, 2), game.main_sides_hours ?? null)
      .input('CompletionistHours', sql.Decimal(10, 2), game.completionist_hours ?? null)
      .input('AllStylesHours', sql.Decimal(10, 2), game.all_styles_hours ?? null)
      .input('Alias', sql.NVarChar(255), normalizeOptionalText(game.alias))
      .input('ScoreRank', sql.Int, game.score_rank ?? null)
      .input('MinOwners', sql.Int, minOwners ?? null)
      .input('MaxOwners', sql.Int, maxOwners ?? null)
      .input('PeakCcu', sql.Int, game.peak_ccu ?? null)
      .input('PlatformsJson', sql.NVarChar(sql.MAX), game.platforms ? JSON.stringify(uniqueNormalized(game.platforms, 'platform')) : null)
      .input('GenresJson', sql.NVarChar(sql.MAX), game.genres ? JSON.stringify(uniqueNormalized(game.genres, 'genre')) : null)
      .input('CategoriesJson', sql.NVarChar(sql.MAX), game.categories ? JSON.stringify(uniqueNormalized(game.categories, 'category')) : null)
      .input('TagsJson', sql.NVarChar(sql.MAX), game.tags ? JSON.stringify(uniqueNormalized(game.tags, 'tag')) : null)
      .input('DevelopersJson', sql.NVarChar(sql.MAX), game.developers ? JSON.stringify(uniqueNormalized(game.developers, 'developer')) : null)
      .input('PublishersJson', sql.NVarChar(sql.MAX), game.publishers ? JSON.stringify(uniqueNormalized(game.publishers, 'publisher')) : null)
      .input('LanguagesJson', sql.NVarChar(sql.MAX), languagesJson)
      .execute<{ Id: number }>('dbo.UpsertSteamGame');

    const id = result.recordset?.[0]?.Id;
    if (!id) throw new Error(`dbo.UpsertSteamGame did not return an Id for steam_appid ${game.steam_appid}`);
    return id;
  }

  // Achievement operations
  async upsertAchievement(achievement: Achievement): Promise<number> {
    if (!achievement.game_id || achievement.game_id <= 0 || !Number.isInteger(achievement.game_id)) {
      throw new Error(`Invalid game_id: ${achievement.game_id}. Must be a positive integer.`);
    }
    const apiName = normalizeText(achievement.steam_apiname, 'steam_apiname');
    const name = normalizeText(achievement.name, 'name');

    const result = await this.pool
      .request()
      .input('GameId', sql.Int, achievement.game_id)
      .input('SteamApiName', sql.NVarChar(255), apiName)
      .input('Name', sql.NVarChar(255), name)
      .input('Description', sql.NVarChar(2000), normalizeOptionalText(achievement.description))
      .input('IconUrl', sql.NVarChar(500), normalizeOptionalText(achievement.icon_url))
      .input('Points', sql.Int, achievement.points ?? null)
      .input('IsHidden', sql.Bit, achievement.is_hidden ?? false)
      .input('DescriptionSource', sql.NVarChar(50), normalizeOptionalText(achievement.description_source))
      .input('LastUpdated', sql.DateTime2, achievement.last_updated ?? null)
      .execute<{ Id: number }>('dbo.UpsertSteamAchievement');

    const id = result.recordset?.[0]?.Id;
    if (!id) throw new Error(`dbo.UpsertSteamAchievement did not return an Id for game_id ${achievement.game_id}`);
    return id;
  }

  // User operations
  async upsertUser(user: User): Promise<number> {
    if (!user.steam_id || typeof user.steam_id !== 'bigint' || user.steam_id <= 0n) {
      throw new Error(`Invalid steam_id: ${String(user.steam_id)}. Must be a positive bigint.`);
    }
    const username = normalizeText(user.username, 'username');

    const result = await this.pool
      .request()
      .input('SteamId', sql.BigInt, user.steam_id)
      .input('Username', sql.NVarChar(255), username)
      .input('ProfileUrl', sql.NVarChar(500), normalizeOptionalText(user.profile_url))
      .input('AvatarUrl', sql.NVarChar(500), normalizeOptionalText(user.avatar_url))
      .execute<{ Id: number }>('dbo.UpsertSteamUser');

    const id = result.recordset?.[0]?.Id;
    if (!id) throw new Error(`dbo.UpsertSteamUser did not return an Id for steam_id ${String(user.steam_id)}`);
    return id;
  }

  // User achievement operations
  async upsertUserAchievement(userAchievement: UserAchievement): Promise<number> {
    if (!userAchievement.user_id || userAchievement.user_id <= 0 || !Number.isInteger(userAchievement.user_id)) {
      throw new Error(`Invalid user_id: ${userAchievement.user_id}. Must be a positive integer.`);
    }
    if (!userAchievement.achievement_id || userAchievement.achievement_id <= 0 || !Number.isInteger(userAchievement.achievement_id)) {
      throw new Error(`Invalid achievement_id: ${userAchievement.achievement_id}. Must be a positive integer.`);
    }

    const result = await this.pool
      .request()
      .input('UserId', sql.Int, userAchievement.user_id)
      .input('AchievementId', sql.Int, userAchievement.achievement_id)
      .input('UnlockedAt', sql.DateTime2, userAchievement.unlocked_at ?? null)
      .execute<{ Id: number }>('dbo.UpsertSteamUserAchievement');

    const id = result.recordset?.[0]?.Id;
    if (!id) throw new Error(`dbo.UpsertSteamUserAchievement did not return an Id for user_id ${userAchievement.user_id}`);
    return id;
  }

  // Get game with achievements
  async getGameWithAchievements(steamAppId: number): Promise<GameWithAchievementsResult[]> {
    if (!steamAppId || steamAppId <= 0 || !Number.isInteger(steamAppId)) {
      throw new Error(`Invalid steamAppId: ${steamAppId}. Must be a positive integer.`);
    }

    const result = await this.pool
      .request()
      .input('SteamAppId', sql.Int, steamAppId)
      .execute<GameWithAchievementsResult>('dbo.GetSteamGameWithAchievements');

    return result.recordset ?? [];
  }

  // Get user achievements for a game
  async getUserGameAchievements(userId: number, gameId: number): Promise<UserGameAchievementResult[]> {
    if (!userId || userId <= 0 || !Number.isInteger(userId)) {
      throw new Error(`Invalid userId: ${userId}. Must be a positive integer.`);
    }
    if (!gameId || gameId <= 0 || !Number.isInteger(gameId)) {
      throw new Error(`Invalid gameId: ${gameId}. Must be a positive integer.`);
    }

    const result = await this.pool
      .request()
      .input('UserId', sql.Int, userId)
      .input('GameId', sql.Int, gameId)
      .execute<UserGameAchievementResult>('dbo.GetSteamUserGameAchievements');

    return result.recordset ?? [];
  }

  // Get achievements for a game
  async getGameAchievements(steamAppId: number): Promise<GameAchievementsResponse> {
    if (!steamAppId || steamAppId <= 0 || !Number.isInteger(steamAppId)) {
      throw new Error(`Invalid steamAppId: ${steamAppId}. Must be a positive integer.`);
    }

    const result = await this.pool
      .request()
      .input('SteamAppId', sql.Int, steamAppId)
      .execute<GameAchievementResult & { GameIdCheck: number }>('dbo.GetSteamGameAchievements');

    if (result.recordset.length === 0 || !result.recordset[0].GameIdCheck) {
      return { gameExists: false, achievements: [] };
    }

    const rows = (result.recordset ?? []) as Array<(GameAchievementResult & { GameIdCheck: number }) | null>;
    const achievements = rows
      .filter((row): row is GameAchievementResult & { GameIdCheck: number } => !!row && (row as any).id !== null)
      .map(({ GameIdCheck: _gameIdCheck, ...achievement }) => achievement) as GameAchievementResult[];

    return { gameExists: true, achievements };
  }

  // Helper method to get game ID by steam_appid
  async getGameIdBySteamAppId(steamAppId: number): Promise<number | null> {
    if (!steamAppId || steamAppId <= 0 || !Number.isInteger(steamAppId)) {
      throw new Error(`Invalid steamAppId: ${steamAppId}. Must be a positive integer.`);
    }

    const result = await this.pool
      .request()
      .input('SteamAppId', sql.Int, steamAppId)
      .execute<{ id: number }>('dbo.GetSteamGameIdBySteamAppId');

    return result.recordset?.[0]?.id ?? null;
  }

  // Helper method to get achievement ID by game_id and steam_apiname
  async getAchievementIdBySteamApiName(gameId: number, steamApiName: string): Promise<number | null> {
    if (!gameId || gameId <= 0 || !Number.isInteger(gameId)) {
      throw new Error(`Invalid gameId: ${gameId}. Must be a positive integer.`);
    }
    const normalizedApiName = normalizeText(steamApiName, 'steamApiName');

    const result = await this.pool
      .request()
      .input('GameId', sql.Int, gameId)
      .input('SteamApiName', sql.NVarChar(255), normalizedApiName)
      .execute<{ id: number }>('dbo.GetSteamAchievementIdByApiName');

    return result.recordset?.[0]?.id ?? null;
  }

  // User game operations
  async upsertUserGame(userGame: UserGame): Promise<number> {
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
      .input('UserId', sql.Int, userGame.user_id)
      .input('GameId', sql.Int, userGame.game_id)
      .input('PlaytimeForever', sql.Int, userGame.playtime_forever)
      .input('Playtime2Weeks', sql.Int, userGame.playtime_2weeks)
      .input('LastPlayedAt', sql.DateTime2, userGame.last_played_at ?? null)
      .execute<{ Id: number }>('dbo.UpsertSteamUserGame');

    const id = result.recordset?.[0]?.Id;
    if (!id) throw new Error(`dbo.UpsertSteamUserGame did not return an Id for user_id ${userGame.user_id}`);
    return id;
  }

  // Soft delete user by setting is_active to false
  async deleteUserBySteamId(steamId: bigint): Promise<boolean> {
    if (!steamId || typeof steamId !== 'bigint' || steamId <= 0n) {
      throw new Error(`Invalid steamId: ${String(steamId)}. Must be a positive bigint.`);
    }

    const transaction = new sql.Transaction(this.pool);
    let began = false;

    try {
      await transaction.begin();
      began = true;

      interface UserIdResult {
        id: number;
      }

      const userResult = await this.req(transaction)
        .input('steam_id', sql.BigInt, steamId)
        .query<UserIdResult>('SELECT TOP 1 Id as id FROM SteamUsers WHERE SteamId = @steam_id AND IsActive = 1');

      const user = userResult.recordset[0];
      if (!user) {
        await transaction.rollback();
        return false;
      }

      await this.req(transaction).input('user_id', sql.Int, user.id).query('UPDATE SteamUsers SET IsActive = 0 WHERE Id = @user_id');
      await transaction.commit();
      return true;
    } catch (error) {
      if (began) {
        try {
          await transaction.rollback();
        } catch {
          // preserve original error
        }
      }
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to soft delete user with steamId ${String(steamId)}: ${msg}`);
    }
  }

  // Get the last updated timestamp for a Steam profile
  // Returns Date of last update, or null if profile never scraped
  async getSteamProfileLastUpdated(steamId: bigint): Promise<Date | null> {
    if (!steamId || typeof steamId !== 'bigint' || steamId <= 0n) {
      throw new Error(`Invalid steamId: ${String(steamId)}. Must be a positive bigint.`);
    }

    interface Result {
      updated_at: Date | null;
    }

    const result = await this.pool
      .request()
      .input('SteamId', sql.BigInt, steamId)
      .query<Result>('SELECT TOP 1 UpdatedAt as updated_at FROM SteamUsers WHERE SteamId = @SteamId AND IsActive = 1');

    return result.recordset?.[0]?.updated_at ?? null;
  }

  // Batch upsert user achievements for better performance
  // Returns number of achievements successfully upserted
  async batchUpsertUserAchievements(userAchievements: UserAchievement[]): Promise<number> {
    if (userAchievements.length === 0) {
      return 0;
    }

    let count = 0;
    const batchSize = 100;

    for (let i = 0; i < userAchievements.length; i += batchSize) {
      const batch = userAchievements.slice(i, i + batchSize);

      for (const ua of batch) {
        try {
          await this.upsertUserAchievement(ua);
          count++;
        } catch (error) {
          // Log but continue with other achievements
          console.error(`Failed to upsert user achievement ${ua.achievement_id}:`, error);
        }
      }
    }

    return count;
  }

  // Get all achievement IDs for a game in a single query for better performance
  // Returns Map of steam_apiname to achievement ID
  async getAchievementMapForGame(gameId: number): Promise<Map<string, number>> {
    if (!gameId || gameId <= 0 || !Number.isInteger(gameId)) {
      throw new Error(`Invalid gameId: ${gameId}. Must be a positive integer.`);
    }

    interface AchievementMapResult {
      id: number;
      steam_apiname: string;
    }

    const result = await this.pool
      .request()
      .input('GameId', sql.Int, gameId)
      .query<AchievementMapResult>('SELECT Id as id, SteamApiName as steam_apiname FROM SteamAchievements WHERE GameId = @GameId');

    const map = new Map<string, number>();
    for (const row of result.recordset) {
      map.set(row.steam_apiname.trim(), row.id);
    }

    return map;
  }
}

