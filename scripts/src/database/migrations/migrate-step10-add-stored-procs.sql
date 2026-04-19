    /*
    Stored procedures to reduce DB round-trips and eliminate N+1 patterns.
    These procedures use set-based operations with OPENJSON and MERGE.

    Run via:
        npm run migrate scripts/src/database/migrations/migrate-step10-add-stored-procs.sql
    */

    SET NOCOUNT ON;

    SELECT 'Migration Status' = 'Step10: Creating/Updating stored procedures (set-based upserts + set-based relationship sync)';
    GO

    /* ============================================================================
    dbo.UpsertSteamGame
    - Upserts SteamGames by SteamAppId
    - Upserts lookup rows (Platforms/Genres/Categories/Tags/Developers/Publishers/Languages)
    - Syncs junction tables in a set-based way
    Inputs:
        - JSON arrays of strings for most relationships
        - @LanguagesJson: JSON array of objects:
            [{ "code":"en", "has_interface":1, "has_full_audio":0, "has_subtitles":1 }]
    ============================================================================ */

    CREATE OR ALTER PROCEDURE dbo.UpsertSteamGame
    @SteamAppId INT,
    @Name NVARCHAR(255),
    @ReleaseDate DATE = NULL,
    @HeaderImageUrl NVARCHAR(500) = NULL,
    @ShortDescription NVARCHAR(2000) = NULL,
    @IsUnlisted BIT = 0,
    @IsRemoved BIT = 0,
    @MainStoryHours DECIMAL(10,2) = NULL,
    @MainSidesHours DECIMAL(10,2) = NULL,
    @CompletionistHours DECIMAL(10,2) = NULL,
    @AllStylesHours DECIMAL(10,2) = NULL,
    @Alias NVARCHAR(255) = NULL,
    @ScoreRank INT = NULL,
    @MinOwners INT = NULL,
    @MaxOwners INT = NULL,
    @PeakCcu INT = NULL,
    @PlatformsJson NVARCHAR(MAX) = NULL,
    @GenresJson NVARCHAR(MAX) = NULL,
    @CategoriesJson NVARCHAR(MAX) = NULL,
    @TagsJson NVARCHAR(MAX) = NULL,
    @DevelopersJson NVARCHAR(MAX) = NULL,
    @PublishersJson NVARCHAR(MAX) = NULL,
    @LanguagesJson NVARCHAR(MAX) = NULL
    AS
    BEGIN
    SET NOCOUNT ON;

    IF @SteamAppId IS NULL OR @SteamAppId <= 0
        THROW 50001, 'SteamAppId must be a positive integer.', 1;
    IF @Name IS NULL OR LTRIM(RTRIM(@Name)) = ''
        THROW 50002, 'Name must be non-empty.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @Upserted TABLE (Id INT NOT NULL);

        MERGE SteamGames WITH (HOLDLOCK) AS target
        USING (SELECT @SteamAppId AS SteamAppId) AS source
        ON target.SteamAppId = source.SteamAppId
        WHEN MATCHED THEN
        UPDATE SET
            Name = @Name,
            ReleaseDate = @ReleaseDate,
            HeaderImageUrl = @HeaderImageUrl,
            UpdateDate = GETUTCDATE(),
            ShortDescription = @ShortDescription,
            IsUnlisted = @IsUnlisted,
            IsRemoved = @IsRemoved,
            MainStoryHours = @MainStoryHours,
            MainSidesHours = @MainSidesHours,
            CompletionistHours = @CompletionistHours,
            AllStylesHours = @AllStylesHours,
            Alias = @Alias,
            ScoreRank = @ScoreRank,
            MinOwners = @MinOwners,
            MaxOwners = @MaxOwners,
            PeakCcu = @PeakCcu
        WHEN NOT MATCHED THEN
        INSERT (SteamAppId, Name, ReleaseDate, HeaderImageUrl, ShortDescription, IsUnlisted, IsRemoved,
                MainStoryHours, MainSidesHours, CompletionistHours, AllStylesHours,
                Alias, ScoreRank, MinOwners, MaxOwners, PeakCcu)
        VALUES (@SteamAppId, @Name, @ReleaseDate, @HeaderImageUrl, @ShortDescription, @IsUnlisted, @IsRemoved,
                @MainStoryHours, @MainSidesHours, @CompletionistHours, @AllStylesHours,
                @Alias, @ScoreRank, @MinOwners, @MaxOwners, @PeakCcu)
        OUTPUT inserted.Id INTO @Upserted(Id);

        DECLARE @GameId INT = (SELECT TOP 1 Id FROM @Upserted);

        /* --------------------------
        Platforms
        -------------------------- */
        IF @PlatformsJson IS NOT NULL AND ISJSON(@PlatformsJson) = 1
        BEGIN
        ;WITH Names AS (
            SELECT DISTINCT LTRIM(RTRIM([value])) AS Name
            FROM OPENJSON(@PlatformsJson)
            WHERE [value] IS NOT NULL AND LTRIM(RTRIM([value])) <> ''
        )
        MERGE SteamPlatforms WITH (HOLDLOCK) AS t
        USING Names AS s ON t.Name = s.Name
        WHEN NOT MATCHED THEN INSERT (Name) VALUES (s.Name);

        ;WITH PlatformIds AS (
            SELECT p.Id
            FROM SteamPlatforms p
            JOIN Names n ON n.Name = p.Name
        )
        MERGE SteamGamePlatforms WITH (HOLDLOCK) AS gp
        USING (SELECT @GameId AS GameId, Id AS PlatformId FROM PlatformIds) AS s
            ON gp.GameId = s.GameId AND gp.PlatformId = s.PlatformId
        WHEN NOT MATCHED THEN
            INSERT (GameId, PlatformId) VALUES (s.GameId, s.PlatformId)
        WHEN NOT MATCHED BY SOURCE AND gp.GameId = @GameId THEN
            DELETE;
        END

        /* --------------------------
        Genres
        -------------------------- */
        IF @GenresJson IS NOT NULL AND ISJSON(@GenresJson) = 1
        BEGIN
        ;WITH Names AS (
            SELECT DISTINCT LTRIM(RTRIM([value])) AS Name
            FROM OPENJSON(@GenresJson)
            WHERE [value] IS NOT NULL AND LTRIM(RTRIM([value])) <> ''
        )
        MERGE SteamGenres WITH (HOLDLOCK) AS t
        USING Names AS s ON t.Name = s.Name
        WHEN NOT MATCHED THEN INSERT (Name) VALUES (s.Name);

        ;WITH Ids AS (
            SELECT g.Id
            FROM SteamGenres g
            JOIN Names n ON n.Name = g.Name
        )
        MERGE SteamGameGenres WITH (HOLDLOCK) AS gg
        USING (SELECT @GameId AS GameId, Id AS GenreId FROM Ids) AS s
            ON gg.GameId = s.GameId AND gg.GenreId = s.GenreId
        WHEN NOT MATCHED THEN
            INSERT (GameId, GenreId) VALUES (s.GameId, s.GenreId)
        WHEN NOT MATCHED BY SOURCE AND gg.GameId = @GameId THEN
            DELETE;
        END

        /* --------------------------
        Categories
        -------------------------- */
        IF @CategoriesJson IS NOT NULL AND ISJSON(@CategoriesJson) = 1
        BEGIN
        ;WITH Names AS (
            SELECT DISTINCT LTRIM(RTRIM([value])) AS Name
            FROM OPENJSON(@CategoriesJson)
            WHERE [value] IS NOT NULL AND LTRIM(RTRIM([value])) <> ''
        )
        MERGE SteamCategories WITH (HOLDLOCK) AS t
        USING Names AS s ON t.Name = s.Name
        WHEN NOT MATCHED THEN INSERT (Name) VALUES (s.Name);

        ;WITH Ids AS (
            SELECT c.Id
            FROM SteamCategories c
            JOIN Names n ON n.Name = c.Name
        )
        MERGE SteamGameCategories WITH (HOLDLOCK) AS gc
        USING (SELECT @GameId AS GameId, Id AS CategoryId FROM Ids) AS s
            ON gc.GameId = s.GameId AND gc.CategoryId = s.CategoryId
        WHEN NOT MATCHED THEN
            INSERT (GameId, CategoryId) VALUES (s.GameId, s.CategoryId)
        WHEN NOT MATCHED BY SOURCE AND gc.GameId = @GameId THEN
            DELETE;
        END

        /* --------------------------
        Tags
        -------------------------- */
        IF @TagsJson IS NOT NULL AND ISJSON(@TagsJson) = 1
        BEGIN
        ;WITH Names AS (
            SELECT DISTINCT LTRIM(RTRIM([value])) AS Name
            FROM OPENJSON(@TagsJson)
            WHERE [value] IS NOT NULL AND LTRIM(RTRIM([value])) <> ''
        )
        MERGE SteamTags WITH (HOLDLOCK) AS t
        USING Names AS s ON t.Name = s.Name
        WHEN NOT MATCHED THEN INSERT (Name) VALUES (s.Name);

        ;WITH Ids AS (
            SELECT t.Id
            FROM SteamTags t
            JOIN Names n ON n.Name = t.Name
        )
        MERGE SteamGameTags WITH (HOLDLOCK) AS gt
        USING (SELECT @GameId AS GameId, Id AS TagId FROM Ids) AS s
            ON gt.GameId = s.GameId AND gt.TagId = s.TagId
        WHEN NOT MATCHED THEN
            INSERT (GameId, TagId) VALUES (s.GameId, s.TagId)
        WHEN NOT MATCHED BY SOURCE AND gt.GameId = @GameId THEN
            DELETE;
        END

        /* --------------------------
        Developers
        -------------------------- */
        IF @DevelopersJson IS NOT NULL AND ISJSON(@DevelopersJson) = 1
        BEGIN
        ;WITH Names AS (
            SELECT DISTINCT LTRIM(RTRIM([value])) AS Name
            FROM OPENJSON(@DevelopersJson)
            WHERE [value] IS NOT NULL AND LTRIM(RTRIM([value])) <> ''
        )
        MERGE SteamDevelopers WITH (HOLDLOCK) AS t
        USING Names AS s ON t.Name = s.Name
        WHEN NOT MATCHED THEN INSERT (Name) VALUES (s.Name);

        ;WITH Ids AS (
            SELECT d.Id
            FROM SteamDevelopers d
            JOIN Names n ON n.Name = d.Name
        )
        MERGE SteamGameDevelopers WITH (HOLDLOCK) AS gd
        USING (SELECT @GameId AS GameId, Id AS DeveloperId FROM Ids) AS s
            ON gd.GameId = s.GameId AND gd.DeveloperId = s.DeveloperId
        WHEN NOT MATCHED THEN
            INSERT (GameId, DeveloperId) VALUES (s.GameId, s.DeveloperId)
        WHEN NOT MATCHED BY SOURCE AND gd.GameId = @GameId THEN
            DELETE;
        END

        /* --------------------------
        Publishers
        -------------------------- */
        IF @PublishersJson IS NOT NULL AND ISJSON(@PublishersJson) = 1
        BEGIN
        ;WITH Names AS (
            SELECT DISTINCT LTRIM(RTRIM([value])) AS Name
            FROM OPENJSON(@PublishersJson)
            WHERE [value] IS NOT NULL AND LTRIM(RTRIM([value])) <> ''
        )
        MERGE SteamPublishers WITH (HOLDLOCK) AS t
        USING Names AS s ON t.Name = s.Name
        WHEN NOT MATCHED THEN INSERT (Name) VALUES (s.Name);

        ;WITH Ids AS (
            SELECT p.Id
            FROM SteamPublishers p
            JOIN Names n ON n.Name = p.Name
        )
        MERGE SteamGamePublishers WITH (HOLDLOCK) AS gp
        USING (SELECT @GameId AS GameId, Id AS PublisherId FROM Ids) AS s
            ON gp.GameId = s.GameId AND gp.PublisherId = s.PublisherId
        WHEN NOT MATCHED THEN
            INSERT (GameId, PublisherId) VALUES (s.GameId, s.PublisherId)
        WHEN NOT MATCHED BY SOURCE AND gp.GameId = @GameId THEN
            DELETE;
        END

        /* --------------------------
        Languages (object array)
        -------------------------- */
        IF @LanguagesJson IS NOT NULL AND ISJSON(@LanguagesJson) = 1
        BEGIN
        ;WITH Langs AS (
            SELECT DISTINCT
            LTRIM(RTRIM(JSON_VALUE([value], '$.code'))) AS Code,
            CAST(ISNULL(JSON_VALUE([value], '$.has_interface'), 0) AS BIT) AS HasInterface,
            CAST(ISNULL(JSON_VALUE([value], '$.has_full_audio'), 0) AS BIT) AS HasFullAudio,
            CAST(ISNULL(JSON_VALUE([value], '$.has_subtitles'), 0) AS BIT) AS HasSubtitles
            FROM OPENJSON(@LanguagesJson)
            WHERE JSON_VALUE([value], '$.code') IS NOT NULL AND LTRIM(RTRIM(JSON_VALUE([value], '$.code'))) <> ''
        )
        MERGE SteamLanguages WITH (HOLDLOCK) AS t
        USING (SELECT Code, Code AS Name FROM Langs) AS s
            ON t.Code = s.Code
        WHEN NOT MATCHED THEN
            INSERT (Code, Name) VALUES (s.Code, s.Name);

        ;WITH LangIds AS (
            SELECT l.Id, x.HasInterface, x.HasFullAudio, x.HasSubtitles
            FROM Langs x
            JOIN SteamLanguages l ON l.Code = x.Code
        )
        MERGE SteamGameLanguages WITH (HOLDLOCK) AS gl
        USING (
            SELECT @GameId AS GameId, Id AS LanguageId, HasInterface, HasFullAudio, HasSubtitles
            FROM LangIds
        ) AS s
            ON gl.GameId = s.GameId
        AND gl.LanguageId = s.LanguageId
        AND gl.HasInterface = s.HasInterface
        AND gl.HasFullAudio = s.HasFullAudio
        AND gl.HasSubtitles = s.HasSubtitles
        WHEN NOT MATCHED THEN
            INSERT (GameId, LanguageId, HasInterface, HasFullAudio, HasSubtitles)
            VALUES (s.GameId, s.LanguageId, s.HasInterface, s.HasFullAudio, s.HasSubtitles)
        WHEN NOT MATCHED BY SOURCE AND gl.GameId = @GameId THEN
            DELETE;
        END

        COMMIT TRANSACTION;

        SELECT @GameId AS Id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
    END;
    GO

    /* ============================================================================
    Basic upsert procs (atomic via MERGE)
    ============================================================================ */

    CREATE OR ALTER PROCEDURE dbo.UpsertSteamAchievement
    @GameId INT,
    @SteamApiName NVARCHAR(255),
    @Name NVARCHAR(255),
    @Description NVARCHAR(2000) = NULL,
    @IconUrl NVARCHAR(500) = NULL,
    @Points INT = NULL,
    @IsHidden BIT = 0,
    @DescriptionSource NVARCHAR(50) = NULL,
    @LastUpdated DATETIME2 = NULL
    AS
    BEGIN
    SET NOCOUNT ON;
    DECLARE @Upserted TABLE (Id INT NOT NULL);

    MERGE SteamAchievements WITH (HOLDLOCK) AS t
    USING (SELECT @GameId AS GameId, @SteamApiName AS SteamApiName) AS s
        ON t.GameId = s.GameId AND t.SteamApiName = s.SteamApiName
    WHEN MATCHED THEN
        UPDATE SET
        Name = @Name,
        Description = @Description,
        IconUrl = @IconUrl,
        Points = @Points,
        IsHidden = @IsHidden,
        DescriptionSource = @DescriptionSource,
        LastUpdated = COALESCE(@LastUpdated, t.LastUpdated, t.CreateDate)
    WHEN NOT MATCHED THEN
        INSERT (GameId, SteamApiName, Name, Description, IconUrl, Points, IsHidden, DescriptionSource, LastUpdated)
        VALUES (@GameId, @SteamApiName, @Name, @Description, @IconUrl, @Points, @IsHidden, @DescriptionSource, COALESCE(@LastUpdated, GETUTCDATE()))
    OUTPUT inserted.Id INTO @Upserted(Id);

    SELECT TOP 1 Id FROM @Upserted;
    END;
    GO

    CREATE OR ALTER PROCEDURE dbo.UpsertSteamUser
    @SteamId BIGINT,
    @Username NVARCHAR(255),
    @ProfileUrl NVARCHAR(500) = NULL,
    @AvatarUrl NVARCHAR(500) = NULL
    AS
    BEGIN
    SET NOCOUNT ON;
    DECLARE @Upserted TABLE (Id INT NOT NULL);

    MERGE SteamUsers WITH (HOLDLOCK) AS t
    USING (SELECT @SteamId AS SteamId) AS s
        ON t.SteamId = s.SteamId
    WHEN MATCHED THEN
        UPDATE SET
        Username = @Username,
        ProfileUrl = @ProfileUrl,
        AvatarUrl = @AvatarUrl,
        IsActive = 1
    WHEN NOT MATCHED THEN
        INSERT (SteamId, Username, ProfileUrl, AvatarUrl, IsActive)
        VALUES (@SteamId, @Username, @ProfileUrl, @AvatarUrl, 1)
    OUTPUT inserted.Id INTO @Upserted(Id);

    SELECT TOP 1 Id FROM @Upserted;
    END;
    GO

    CREATE OR ALTER PROCEDURE dbo.UpsertSteamUserAchievement
    @UserId INT,
    @AchievementId INT,
    @UnlockedAt DATETIME2 = NULL
    AS
    BEGIN
    SET NOCOUNT ON;
    DECLARE @Upserted TABLE (Id INT NOT NULL);

    MERGE SteamUserAchievements WITH (HOLDLOCK) AS t
    USING (SELECT @UserId AS UserId, @AchievementId AS AchievementId) AS s
        ON t.UserId = s.UserId AND t.AchievementId = s.AchievementId
    WHEN MATCHED THEN
        UPDATE SET UnlockedAt = @UnlockedAt
    WHEN NOT MATCHED THEN
        INSERT (UserId, AchievementId, UnlockedAt)
        VALUES (@UserId, @AchievementId, @UnlockedAt)
    OUTPUT inserted.Id INTO @Upserted(Id);

    SELECT TOP 1 Id FROM @Upserted;
    END;
    GO

    CREATE OR ALTER PROCEDURE dbo.UpsertSteamUserGame
    @UserId INT,
    @GameId INT,
    @PlaytimeForever INT,
    @Playtime2Weeks INT,
    @LastPlayedAt DATETIME2 = NULL
    AS
    BEGIN
    SET NOCOUNT ON;
    DECLARE @Upserted TABLE (Id INT NOT NULL);

    MERGE SteamUserGames WITH (HOLDLOCK) AS t
    USING (SELECT @UserId AS UserId, @GameId AS GameId) AS s
        ON t.UserId = s.UserId AND t.GameId = s.GameId
    WHEN MATCHED THEN
        UPDATE SET
        PlaytimeForever = @PlaytimeForever,
        Playtime2Weeks = @Playtime2Weeks,
        LastPlayedAt = @LastPlayedAt
    WHEN NOT MATCHED THEN
        INSERT (UserId, GameId, PlaytimeForever, Playtime2Weeks, LastPlayedAt)
        VALUES (@UserId, @GameId, @PlaytimeForever, @Playtime2Weeks, @LastPlayedAt)
    OUTPUT inserted.Id INTO @Upserted(Id);

    SELECT TOP 1 Id FROM @Upserted;
    END;
    GO

    /* ============================================================================
    Read/query procs to reduce hardcoded SQL
    ============================================================================ */

    CREATE OR ALTER PROCEDURE dbo.GetSteamGameIdBySteamAppId
    @SteamAppId INT
    AS
    BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 Id as id FROM SteamGames WHERE SteamAppId = @SteamAppId;
    END;
    GO

    CREATE OR ALTER PROCEDURE dbo.GetSteamAchievementIdByApiName
    @GameId INT,
    @SteamApiName NVARCHAR(255)
    AS
    BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 Id as id FROM SteamAchievements WHERE GameId = @GameId AND SteamApiName = @SteamApiName;
    END;
    GO

    CREATE OR ALTER PROCEDURE dbo.GetSteamGameWithAchievements
    @SteamAppId INT
    AS
    BEGIN
    SET NOCOUNT ON;
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
    WHERE g.SteamAppId = @SteamAppId
    ORDER BY a.Points DESC, a.Name;
    END;
    GO

    CREATE OR ALTER PROCEDURE dbo.GetSteamUserGameAchievements
    @UserId INT,
    @GameId INT
    AS
    BEGIN
    SET NOCOUNT ON;
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
    LEFT JOIN SteamUserAchievements ua ON a.Id = ua.AchievementId AND ua.UserId = @UserId
    WHERE a.GameId = @GameId
    ORDER BY a.Points DESC, a.Name;
    END;
    GO

    CREATE OR ALTER PROCEDURE dbo.GetSteamGameAchievements
    @SteamAppId INT
    AS
    BEGIN
    SET NOCOUNT ON;
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
    WHERE g.SteamAppId = @SteamAppId
    ORDER BY 
        CASE WHEN a.IsHidden IS NULL THEN 1 ELSE 0 END,
        a.IsHidden ASC,
        CASE WHEN a.Points IS NULL THEN 1 ELSE 0 END,
        a.Points DESC,
        CASE WHEN a.Name IS NULL THEN 1 ELSE 0 END,
        a.Name ASC;
    END;
    GO

    SELECT 'Migration Status' = 'Step10: Stored procedures created/updated.';

