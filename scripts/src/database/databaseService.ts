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
    nameType: sql.ISqlType,
    name: string,
    transaction?: Tx,
  ): Promise<number> {
    const normalized = normalizeText(name, 'name');
    interface Row {
      id: number;
    }

    // MERGE makes this atomic in SQL Server, preventing the SELECT-then-INSERT race.
    // WHEN MATCHED branch is a no-op update that ensures OUTPUT fires for existing rows too.
    const result = await this.req(transaction)
      .input('name', nameType, normalized)
      .query<Row>(`
        MERGE ${table} WITH (HOLDLOCK) AS target
        USING (SELECT @name AS ${nameColumn}) AS source
          ON target.${nameColumn} = source.${nameColumn}
        WHEN MATCHED THEN
          UPDATE SET ${nameColumn} = target.${nameColumn}
        WHEN NOT MATCHED THEN
          INSERT (${nameColumn}) VALUES (source.${nameColumn})
        OUTPUT inserted.Id as id;
      `);

    const id = result.recordset[0]?.id;
    if (id == null) throw new Error(`Failed to get or create row in ${table} for name: ${normalized}`);
    return id;
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
    function toPlatformTinyint(name: string): number | null {
      const n = name.toLowerCase();
      if (n === 'windows' || n === 'win' || n.includes('windows')) return 1;
      if (n === 'mac' || n === 'macos' || n === 'osx' || n.includes('mac')) return 2;
      if (n === 'linux' || n === 'steamos' || n.includes('linux')) return 3;
      return null;
    }
    const values = [...new Set(platformNames.map(toPlatformTinyint).filter((v): v is number => v !== null))];
    await this.req(transaction).input('game_id', sql.Int, gameId).query('DELETE FROM dbo.SteamGamePlatforms WHERE GameId = @game_id');
    for (const platform of values) {
      await this.req(transaction)
        .input('game_id', sql.Int, gameId)
        .input('platform', sql.TinyInt, platform)
        .query('INSERT INTO dbo.SteamGamePlatforms (GameId, Platform) VALUES (@game_id, @platform)');
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

    const result = await this.pool
      .request()
      .input('SteamAppId', sql.Int, game.steam_appid)
      .input('Name', sql.NVarChar(255), gameName)
      .input('ReleaseDate', sql.Date, game.release_date ?? null)
      .input('HeaderImageUrl', sql.NVarChar(500), normalizeOptionalText(game.header_image_url))
      .input('ShortDescription', sql.NVarChar(2000), normalizeOptionalText(game.short_description))
      .input('IsUnlisted', sql.Bit, game.is_unlisted ?? false)
      .input('IsRemoved', sql.Bit, game.is_removed ?? false)
      .input('Alias', sql.NVarChar(255), normalizeOptionalText(game.alias))
      .query<{ Id: number }>(`
DECLARE @Upserted TABLE (Id INT NOT NULL);
MERGE dbo.SteamGames WITH (HOLDLOCK) AS t
USING (SELECT @SteamAppId AS SteamAppId) AS s
    ON t.SteamAppId = s.SteamAppId
WHEN MATCHED THEN
    UPDATE SET
        Name = @Name,
        ReleaseDate = COALESCE(@ReleaseDate, t.ReleaseDate),
        HeaderImageUrl = COALESCE(@HeaderImageUrl, t.HeaderImageUrl),
        ShortDescription = COALESCE(@ShortDescription, t.ShortDescription),
        IsUnlisted = @IsUnlisted,
        IsRemoved = @IsRemoved,
        Alias = COALESCE(@Alias, t.Alias),
        UpdateDate = GETUTCDATE()
WHEN NOT MATCHED THEN
    INSERT (SteamAppId, Name, ReleaseDate, HeaderImageUrl, ShortDescription, IsUnlisted, IsRemoved, Alias, CreateDate, UpdateDate, IsActive)
    VALUES (@SteamAppId, @Name, @ReleaseDate, @HeaderImageUrl, @ShortDescription, @IsUnlisted, @IsRemoved, @Alias, GETUTCDATE(), GETUTCDATE(), 1)
OUTPUT inserted.Id INTO @Upserted(Id);
SELECT TOP 1 Id FROM @Upserted;
`);

    const id = result.recordset?.[0]?.Id;
    if (!id) throw new Error(`SteamGames upsert did not return an Id for steam_appid ${game.steam_appid}`);

    if (game.platforms?.length) await this.setGamePlatforms(id, game.platforms);
    if (game.genres?.length) await this.setGameGenres(id, game.genres);
    if (game.categories?.length) await this.setGameCategories(id, game.categories);
    if (game.tags?.length) await this.setGameTags(id, game.tags);
    if (game.developers?.length) await this.setGameDevelopers(id, game.developers);
    if (game.publishers?.length) await this.setGamePublishers(id, game.publishers);
    if (game.languages?.length) await this.setGameLanguages(id, game.languages);

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
      .input('Points', sql.Int, achievement.points ?? 0)
      .input('IsHidden', sql.Bit, achievement.is_hidden ?? false)
      .input('DescriptionSource', sql.NVarChar(50), normalizeOptionalText(achievement.description_source))
      .input('LastUpdated', sql.DateTime2, achievement.last_updated ?? null)
      .query<{ Id: number }>(`
DECLARE @Upserted TABLE (Id INT NOT NULL);
MERGE dbo.SteamAchievements WITH (HOLDLOCK) AS t
USING (SELECT @GameId AS GameId, @SteamApiName AS SteamApiName) AS s
    ON t.GameId = s.GameId AND t.SteamApiName = s.SteamApiName
WHEN MATCHED THEN
    UPDATE SET
        Name = @Name,
        Description = @Description,
        IconUrl = @IconUrl,
        Points = COALESCE(@Points, t.Points),
        IsHidden = @IsHidden,
        DescriptionSource = @DescriptionSource,
        UpdateDate = COALESCE(@LastUpdated, GETUTCDATE())
WHEN NOT MATCHED THEN
    INSERT (GameId, SteamApiName, Name, Description, IconUrl, Points, IsHidden, DescriptionSource,
            IsUnobtainable, IsBuggy, IsConditionallyObtainable, IsMultiplayer, IsMissable, IsGrind,
            IsRandom, IsDateSpecific, IsViral, IsDLC, IsWorldRecord, CreateDate, UpdateDate, IsActive)
    VALUES (@GameId, @SteamApiName, @Name, @Description, @IconUrl, COALESCE(@Points, 0), @IsHidden,
            @DescriptionSource, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, GETUTCDATE(), COALESCE(@LastUpdated, GETUTCDATE()), 1)
OUTPUT inserted.Id INTO @Upserted(Id);
SELECT TOP 1 Id FROM @Upserted;
`);

    const id = result.recordset?.[0]?.Id;
    if (!id) throw new Error(`SteamAchievements upsert did not return an Id for game_id ${achievement.game_id}`);
    return id;
  }

  /**
   * SteamUserAchievements / SteamUserGames FK to UserSteamProfiles.SteamId.
   * Legacy dbo.UpsertSteamUser may only touch SteamUsers — always sync this table.
   */
  private async mergeUserSteamProfilesRow(user: User): Promise<void> {
    const username = normalizeText(user.username, 'username');
    await this.pool
      .request()
      .input('SteamId', sql.BigInt, user.steam_id)
      .input('Username', sql.NVarChar(255), username)
      .input('ProfileUrl', sql.NVarChar(500), normalizeOptionalText(user.profile_url))
      .input('AvatarUrl', sql.NVarChar(500), normalizeOptionalText(user.avatar_url))
      .query(`
MERGE dbo.UserSteamProfiles WITH (HOLDLOCK) AS t
USING (SELECT @SteamId AS SteamId) AS s
    ON t.SteamId = s.SteamId
WHEN MATCHED THEN
    UPDATE SET
        PersonaName = LEFT(LTRIM(RTRIM(@Username)), 64),
        ProfileUrl = LEFT(@ProfileUrl, 256),
        AvatarFullUrl = LEFT(@AvatarUrl, 256),
        LastSyncedDate = GETUTCDATE(),
        UpdateDate = GETUTCDATE(),
        IsActive = 1
WHEN NOT MATCHED THEN
    INSERT (SteamId, PersonaName, ProfileUrl, AvatarFullUrl, LastSyncedDate, CreateDate, UpdateDate, IsActive)
    VALUES (@SteamId, LEFT(LTRIM(RTRIM(@Username)), 64), LEFT(@ProfileUrl, 256), LEFT(@AvatarUrl, 256), GETUTCDATE(), GETUTCDATE(), GETUTCDATE(), 1);
`);
  }

  // User operations
  async upsertUser(user: User): Promise<bigint> {
    if (!user.steam_id || typeof user.steam_id !== 'bigint' || user.steam_id <= 0n) {
      throw new Error(`Invalid steam_id: ${String(user.steam_id)}. Must be a positive bigint.`);
    }
    await this.mergeUserSteamProfilesRow(user);
    return user.steam_id;
  }

  async upsertSteamUserApiSnapshot(steamId: bigint, snapshotKey: string, jsonPayload: string): Promise<void> {
    if (!steamId || steamId <= 0n) {
      throw new Error(`Invalid steamId for snapshot: ${String(steamId)}`);
    }
    const key = normalizeText(snapshotKey, 'snapshotKey');
    if (key.length > 256) {
      throw new Error('snapshotKey must be at most 256 characters');
    }

    await this.pool
      .request()
      .input('SteamId', sql.BigInt, steamId)
      .input('SnapshotKey', sql.NVarChar(256), key)
      .input('JsonPayload', sql.NVarChar(sql.MAX), jsonPayload)
      .query(`
MERGE dbo.SteamUserApiSnapshots WITH (HOLDLOCK) AS t
USING (SELECT @SteamId AS SteamId, @SnapshotKey AS SnapshotKey) AS s
    ON t.SteamId = s.SteamId AND t.SnapshotKey = s.SnapshotKey
WHEN MATCHED THEN
    UPDATE SET JsonPayload = @JsonPayload, UpdatedAt = GETUTCDATE()
WHEN NOT MATCHED THEN
    INSERT (SteamId, SnapshotKey, JsonPayload, UpdatedAt)
    VALUES (@SteamId, @SnapshotKey, @JsonPayload, GETUTCDATE());
`);
  }

  // User achievement operations
  async upsertUserAchievement(userAchievement: UserAchievement): Promise<number> {
    if (!userAchievement.steam_id || typeof userAchievement.steam_id !== 'bigint' || userAchievement.steam_id <= 0n) {
      throw new Error(`Invalid steam_id: ${String(userAchievement.steam_id)}. Must be a positive bigint.`);
    }
    if (!userAchievement.achievement_id || userAchievement.achievement_id <= 0 || !Number.isInteger(userAchievement.achievement_id)) {
      throw new Error(`Invalid achievement_id: ${userAchievement.achievement_id}. Must be a positive integer.`);
    }

    const result = await this.pool
      .request()
      .input('SteamId', sql.BigInt, userAchievement.steam_id)
      .input('AchievementId', sql.Int, userAchievement.achievement_id)
      .input('UnlockedAt', sql.DateTime2, userAchievement.unlocked_at ?? null)
      .query<{ Id: number }>(`
DECLARE @Upserted TABLE (Id INT NOT NULL);
MERGE dbo.SteamUserAchievements WITH (HOLDLOCK) AS t
USING (SELECT @SteamId AS SteamId, @AchievementId AS AchievementId) AS s
    ON t.SteamId = s.SteamId AND t.AchievementId = s.AchievementId
WHEN MATCHED THEN
    UPDATE SET UnlockedAt = COALESCE(@UnlockedAt, t.UnlockedAt), UpdateDate = GETUTCDATE()
WHEN NOT MATCHED THEN
    INSERT (SteamId, AchievementId, UnlockedAt, CreateDate, UpdateDate, IsActive)
    VALUES (@SteamId, @AchievementId, COALESCE(@UnlockedAt, GETUTCDATE()), GETUTCDATE(), GETUTCDATE(), 1)
OUTPUT inserted.Id INTO @Upserted(Id);
SELECT TOP 1 Id FROM @Upserted;
`);

    const id = result.recordset?.[0]?.Id;
    if (!id) throw new Error(`Inline SteamUserAchievements upsert did not return Id`);
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
      .query<GameWithAchievementsResult>(`
SELECT
    g.Id as id, g.SteamAppId as steam_appid, g.Name as name,
    g.ReleaseDate as release_date, g.HeaderImageUrl as header_image_url,
    g.CreateDate as created_at, g.UpdateDate as updated_at,
    g.ShortDescription as short_description, g.IsUnlisted as is_unlisted,
    g.IsRemoved as is_removed, g.Alias as alias,
    a.Id as achievement_id, a.SteamApiName as steam_apiname,
    a.Name as achievement_name, a.Description as achievement_description,
    a.IconUrl as achievement_icon, a.Points as points, a.IsHidden as is_hidden
FROM dbo.SteamGames g
LEFT JOIN dbo.SteamAchievements a ON g.Id = a.GameId AND a.IsActive = 1
WHERE g.SteamAppId = @SteamAppId
ORDER BY a.Points DESC, a.Name
`);

    return result.recordset ?? [];
  }

  // Get user achievements for a game
  async getUserGameAchievements(steamId: bigint, gameId: number): Promise<UserGameAchievementResult[]> {
    if (!steamId || typeof steamId !== 'bigint' || steamId <= 0n) {
      throw new Error(`Invalid steamId: ${String(steamId)}. Must be a positive bigint.`);
    }
    if (!gameId || gameId <= 0 || !Number.isInteger(gameId)) {
      throw new Error(`Invalid gameId: ${gameId}. Must be a positive integer.`);
    }

    const result = await this.pool
      .request()
      .input('SteamId', sql.BigInt, steamId)
      .input('GameId', sql.Int, gameId)
      .query<UserGameAchievementResult>(`
SELECT
    a.Id as id, a.GameId as game_id, a.SteamApiName as steam_apiname,
    a.Name as name, a.Description as description, a.IconUrl as icon_url,
    a.Points as points, a.IsHidden as is_hidden, a.CreateDate as created_at,
    a.DescriptionSource as description_source, a.UpdateDate as last_updated,
    ua.UnlockedAt as unlocked_at,
    CAST(CASE WHEN ua.Id IS NOT NULL THEN 1 ELSE 0 END AS BIT) as is_unlocked
FROM dbo.SteamAchievements a
LEFT JOIN dbo.SteamUserAchievements ua ON a.Id = ua.AchievementId AND ua.SteamId = @SteamId
WHERE a.GameId = @GameId AND a.IsActive = 1
ORDER BY a.Points DESC, a.Name
`);

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
      .query<GameAchievementResult & { GameIdCheck: number }>(`
SELECT
    a.Id as id, a.GameId as game_id, a.SteamApiName as steam_apiname,
    a.Name as name, a.Description as description, a.IconUrl as icon_url,
    a.Points as points, a.IsHidden as is_hidden, a.CreateDate as created_at,
    a.DescriptionSource as description_source, a.UpdateDate as last_updated,
    g.Id as GameIdCheck
FROM dbo.SteamGames g
LEFT JOIN dbo.SteamAchievements a ON g.Id = a.GameId AND a.IsActive = 1
WHERE g.SteamAppId = @SteamAppId
ORDER BY
    CASE WHEN a.IsHidden IS NULL THEN 1 ELSE 0 END,
    a.IsHidden ASC,
    CASE WHEN a.Points IS NULL THEN 1 ELSE 0 END,
    a.Points DESC,
    CASE WHEN a.Name IS NULL THEN 1 ELSE 0 END,
    a.Name ASC
`);

    if (result.recordset.length === 0 || !result.recordset[0].GameIdCheck) {
      return { gameExists: false, achievements: [] };
    }

    const rows = (result.recordset ?? []) as Array<(GameAchievementResult & { GameIdCheck: number }) | null>;
    const achievements = rows
      .filter((row): row is GameAchievementResult & { GameIdCheck: number } => row != null && row.id != null)
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
      .query<{ id: number }>(`SELECT TOP 1 Id as id FROM dbo.SteamGames WHERE SteamAppId = @SteamAppId AND IsActive = 1`);

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
      .query<{ id: number }>(`SELECT TOP 1 Id as id FROM dbo.SteamAchievements WHERE GameId = @GameId AND SteamApiName = @SteamApiName AND IsActive = 1`);

    return result.recordset?.[0]?.id ?? null;
  }

  // User game operations
  async upsertUserGame(userGame: UserGame): Promise<number> {
    if (!userGame.steam_id || typeof userGame.steam_id !== 'bigint' || userGame.steam_id <= 0n) {
      throw new Error(`Invalid steam_id: ${String(userGame.steam_id)}. Must be a positive bigint.`);
    }
    if (!userGame.game_id || userGame.game_id <= 0 || !Number.isInteger(userGame.game_id)) {
      throw new Error(`Invalid game_id: ${userGame.game_id}. Must be a positive integer.`);
    }
    if (userGame.playtime_forever < 0 || !Number.isInteger(userGame.playtime_forever)) {
      throw new Error(`Invalid playtime_forever: ${userGame.playtime_forever}. Must be a non-negative integer.`);
    }

    const result = await this.pool
      .request()
      .input('SteamId', sql.BigInt, userGame.steam_id)
      .input('GameId', sql.Int, userGame.game_id)
      .input('PlaytimeForever', sql.Int, userGame.playtime_forever)
      .input('LastPlayedAt', sql.DateTime2, userGame.last_played_at ?? null)
      .query<{ Id: number }>(`
DECLARE @Upserted TABLE (Id INT NOT NULL);
MERGE dbo.SteamUserGames WITH (HOLDLOCK) AS t
USING (SELECT @SteamId AS SteamId, @GameId AS GameId) AS s
    ON t.SteamId = s.SteamId AND t.GameId = s.GameId
WHEN MATCHED THEN
    UPDATE SET
        PlaytimeForever = @PlaytimeForever,
        LastPlayedAt = @LastPlayedAt,
        UpdateDate = GETUTCDATE()
WHEN NOT MATCHED THEN
    INSERT (SteamId, GameId, PlaytimeForever, LastPlayedAt, CreateDate, UpdateDate, IsActive)
    VALUES (@SteamId, @GameId, @PlaytimeForever, @LastPlayedAt, GETUTCDATE(), GETUTCDATE(), 1)
OUTPUT inserted.Id INTO @Upserted(Id);
SELECT TOP 1 Id FROM @Upserted;
`);

    const id = result.recordset?.[0]?.Id;
    if (!id) throw new Error(`Inline SteamUserGames upsert did not return Id`);
    return id;
  }

  /** Used by scraper incremental mode — any prior sync counts as incremental. */
  async getSteamProfileLastUpdated(steamId: bigint): Promise<Date | null> {
    if (!steamId || typeof steamId !== 'bigint' || steamId <= 0n) {
      throw new Error(`Invalid steamId: ${String(steamId)}. Must be a positive bigint.`);
    }
    const result = await this.pool
      .request()
      .input('SteamId', sql.BigInt, steamId)
      .query<{ LastSyncedDate: Date | null }>(
        `SELECT LastSyncedDate FROM dbo.UserSteamProfiles WHERE SteamId = @SteamId AND IsActive = 1`,
      );
    return result.recordset?.[0]?.LastSyncedDate ?? null;
  }

  /** Map Steam achievement API name -> SteamAchievements.Id for one game. */
  async getAchievementMapForGame(gameId: number): Promise<Map<string, number>> {
    if (!gameId || gameId <= 0 || !Number.isInteger(gameId)) {
      throw new Error(`Invalid gameId: ${gameId}. Must be a positive integer.`);
    }
    const result = await this.pool
      .request()
      .input('GameId', sql.Int, gameId)
      .query<{ SteamApiName: string; Id: number }>(
        `SELECT SteamApiName, Id FROM dbo.SteamAchievements WHERE GameId = @GameId AND IsActive = 1`,
      );
    const map = new Map<string, number>();
    for (const row of result.recordset ?? []) {
      map.set(row.SteamApiName, row.Id);
    }
    return map;
  }

  async batchUpsertUserAchievements(
    userAchievements: Array<{ steam_id: bigint; achievement_id: number; unlocked_at: Date }>,
  ): Promise<number> {
    let count = 0;
    for (const ua of userAchievements) {
      await this.upsertUserAchievement({
        steam_id: ua.steam_id,
        achievement_id: ua.achievement_id,
        unlocked_at: ua.unlocked_at,
      });
      count++;
    }
    return count;
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
        id: bigint | string | number;
      }

      const userResult = await this.req(transaction)
        .input('steam_id', sql.BigInt, steamId)
        .query<UserIdResult>('SELECT TOP 1 SteamId AS id FROM dbo.UserSteamProfiles WHERE SteamId = @steam_id AND IsActive = 1');

      const user = userResult.recordset[0];
      if (!user) {
        await transaction.rollback();
        return false;
      }

      await this.req(transaction)
        .input('steam_id', sql.BigInt, steamId)
        .query('UPDATE dbo.UserSteamProfiles SET IsActive = 0 WHERE SteamId = @steam_id');
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
}
