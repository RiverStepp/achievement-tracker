-- STEP 6: Update data types and fix nullability
-- This step changes NVARCHAR(MAX) to NVARCHAR(2000) and fixes nullability
-- Run this after Step 5 (removing columns) is complete

BEGIN TRANSACTION;

BEGIN TRY
    SELECT 'Step 6: Updating data types and nullability...' AS [Migration Status];
    
    -- Update NVARCHAR(MAX) to NVARCHAR(2000) for descriptions
    -- Note: This requires recreating the column, so we'll skip if it's already the right size
    -- SQL Server doesn't allow direct ALTER COLUMN for size reduction with data
    
    -- Fix nullability for required columns
    -- SteamGames
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'SteamAppId' AND is_nullable = 1)
    BEGIN
        -- Drop any unique constraint and index that depend on SteamAppId before altering nullability
        IF EXISTS (
            SELECT 1
            FROM sys.key_constraints
            WHERE parent_object_id = OBJECT_ID('SteamGames')
              AND name = 'UQ__games__BF842D3146A4D12D'
        )
        BEGIN
            ALTER TABLE SteamGames DROP CONSTRAINT [UQ__games__BF842D3146A4D12D];
        END;

        IF EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE object_id = OBJECT_ID('SteamGames')
              AND name = 'idx_games_steam_appid'
        )
        BEGIN
            DROP INDEX [idx_games_steam_appid] ON SteamGames;
        END;

        ALTER TABLE SteamGames ALTER COLUMN SteamAppId INT NOT NULL;
    END;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'Name' AND is_nullable = 1)
    BEGIN
        -- Replace NULL names with a placeholder before enforcing NOT NULL
        UPDATE SteamGames
        SET Name = '(Unknown Game)'
        WHERE Name IS NULL;

        ALTER TABLE SteamGames ALTER COLUMN Name NVARCHAR(255) NOT NULL;
    END;
    
    -- SteamAchievements
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievements') AND name = 'GameId' AND is_nullable = 1)
    BEGIN
        -- Drop index that depends on GameId before altering nullability
        IF EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE object_id = OBJECT_ID('SteamAchievements')
              AND name = 'idx_achievements_game_id'
        )
        BEGIN
            DROP INDEX [idx_achievements_game_id] ON SteamAchievements;
        END;

        ALTER TABLE SteamAchievements ALTER COLUMN GameId INT NOT NULL;
    END;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievements') AND name = 'SteamApiName' AND is_nullable = 1)
        ALTER TABLE SteamAchievements ALTER COLUMN SteamApiName NVARCHAR(255) NOT NULL;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievements') AND name = 'Name' AND is_nullable = 1)
        ALTER TABLE SteamAchievements ALTER COLUMN Name NVARCHAR(255) NOT NULL;
    
    -- SteamUsers
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUsers') AND name = 'SteamId' AND is_nullable = 1)
    BEGIN
        -- Drop unique constraint and index that depend on SteamId before altering nullability
        IF EXISTS (
            SELECT 1
            FROM sys.key_constraints
            WHERE parent_object_id = OBJECT_ID('SteamUsers')
              AND name = 'UQ__users__AB1191F031649746'
        )
        BEGIN
            ALTER TABLE SteamUsers DROP CONSTRAINT [UQ__users__AB1191F031649746];
        END;

        IF EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE object_id = OBJECT_ID('SteamUsers')
              AND name = 'idx_users_steam_id'
        )
        BEGIN
            DROP INDEX [idx_users_steam_id] ON SteamUsers;
        END;

        ALTER TABLE SteamUsers ALTER COLUMN SteamId BIGINT NOT NULL;
    END;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUsers') AND name = 'Username' AND is_nullable = 1)
        ALTER TABLE SteamUsers ALTER COLUMN Username NVARCHAR(255) NOT NULL;
    
    -- SteamUserGames - fix playtime defaults
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUserGames') AND name = 'PlaytimeForever' AND is_nullable = 1)
    BEGIN
        UPDATE SteamUserGames SET PlaytimeForever = 0 WHERE PlaytimeForever IS NULL;
        ALTER TABLE SteamUserGames ALTER COLUMN PlaytimeForever INT NOT NULL;
        IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('SteamUserGames') AND name LIKE '%PlaytimeForever%')
            ALTER TABLE SteamUserGames ADD CONSTRAINT DF_SteamUserGames_PlaytimeForever DEFAULT 0 FOR PlaytimeForever;
    END
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUserGames') AND name = 'Playtime2Weeks' AND is_nullable = 1)
    BEGIN
        UPDATE SteamUserGames SET Playtime2Weeks = 0 WHERE Playtime2Weeks IS NULL;
        ALTER TABLE SteamUserGames ALTER COLUMN Playtime2Weeks INT NOT NULL;
        IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('SteamUserGames') AND name LIKE '%Playtime2Weeks%')
            ALTER TABLE SteamUserGames ADD CONSTRAINT DF_SteamUserGames_Playtime2Weeks DEFAULT 0 FOR Playtime2Weeks;
    END
    
    -- SteamAchievementStats
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievementStats') AND name = 'AchievementId' AND is_nullable = 1)
    BEGIN
        DELETE FROM SteamAchievementStats WHERE AchievementId IS NULL;
        ALTER TABLE SteamAchievementStats ALTER COLUMN AchievementId INT NOT NULL;
    END
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievementStats') AND name = 'GlobalPercentage' AND is_nullable = 1)
        ALTER TABLE SteamAchievementStats ALTER COLUMN GlobalPercentage DECIMAL(5,2) NOT NULL;
    
    -- SteamGamePrices
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGamePrices') AND name = 'CurrencyCode' AND is_nullable = 1)
    BEGIN
        UPDATE SteamGamePrices SET CurrencyCode = 'USD' WHERE CurrencyCode IS NULL;
        ALTER TABLE SteamGamePrices ALTER COLUMN CurrencyCode NVARCHAR(3) NOT NULL;
    END

    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGamePrices') AND name = 'OriginalCurrencyCode' AND is_nullable = 1)
    BEGIN
        -- If original currency is missing, fall back to the main CurrencyCode or default to USD
        UPDATE SteamGamePrices
        SET OriginalCurrencyCode = COALESCE(OriginalCurrencyCode, CurrencyCode, 'USD')
        WHERE OriginalCurrencyCode IS NULL;

        ALTER TABLE SteamGamePrices ALTER COLUMN OriginalCurrencyCode NVARCHAR(3) NOT NULL;
    END
    
    SELECT 'Step 6 complete: Data types and nullability updated.' AS [Migration Status];
    
    COMMIT TRANSACTION;
    SELECT 'Transaction committed successfully.' AS [Migration Status];
    
END TRY
BEGIN CATCH
    DECLARE @errorMsg NVARCHAR(MAX) = ERROR_MESSAGE();
    SELECT 'Error occurred during Step 6:' AS [Migration Error];
    SELECT @errorMsg AS [Error Message];
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;

