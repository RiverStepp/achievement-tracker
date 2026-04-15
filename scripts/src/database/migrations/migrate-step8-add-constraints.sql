-- STEP 8: Add constraints (UNIQUE, CHECK)
-- This step adds UNIQUE and CHECK constraints
-- Run this after Step 7 (junction tables) is complete

BEGIN TRANSACTION;

BEGIN TRY
    SELECT 'Step 8: Adding constraints...' AS [Migration Status];
    
    -- UNIQUE constraints
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGames')
        AND NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamGames') AND name = 'UQ_SteamGames_SteamAppId')
    BEGIN
        BEGIN TRY
            ALTER TABLE dbo.SteamGames ADD CONSTRAINT UQ_SteamGames_SteamAppId UNIQUE (SteamAppId);
            SELECT 'Added UNIQUE constraint UQ_SteamGames_SteamAppId' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not add UQ_SteamGames_SteamAppId - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamAchievements')
        AND NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamAchievements') AND name = 'UQ_SteamAchievements_GameId_SteamApiName')
    BEGIN
        BEGIN TRY
            ALTER TABLE dbo.SteamAchievements ADD CONSTRAINT UQ_SteamAchievements_GameId_SteamApiName UNIQUE (GameId, SteamApiName);
            SELECT 'Added UNIQUE constraint UQ_SteamAchievements_GameId_SteamApiName' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not add UQ_SteamAchievements_GameId_SteamApiName - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamUsers')
        AND NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamUsers') AND name = 'UQ_SteamUsers_SteamId')
    BEGIN
        BEGIN TRY
            ALTER TABLE dbo.SteamUsers ADD CONSTRAINT UQ_SteamUsers_SteamId UNIQUE (SteamId);
            SELECT 'Added UNIQUE constraint UQ_SteamUsers_SteamId' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not add UQ_SteamUsers_SteamId - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamUserAchievements')
        AND NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamUserAchievements') AND name = 'UQ_SteamUserAchievements_UserId_AchievementId')
    BEGIN
        BEGIN TRY
            ALTER TABLE dbo.SteamUserAchievements ADD CONSTRAINT UQ_SteamUserAchievements_UserId_AchievementId UNIQUE (UserId, AchievementId);
            SELECT 'Added UNIQUE constraint UQ_SteamUserAchievements_UserId_AchievementId' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not add UQ_SteamUserAchievements_UserId_AchievementId - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamUserGames')
        AND NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamUserGames') AND name = 'UQ_SteamUserGames_UserId_GameId')
    BEGIN
        BEGIN TRY
            ALTER TABLE dbo.SteamUserGames ADD CONSTRAINT UQ_SteamUserGames_UserId_GameId UNIQUE (UserId, GameId);
            SELECT 'Added UNIQUE constraint UQ_SteamUserGames_UserId_GameId' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not add UQ_SteamUserGames_UserId_GameId - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    -- Handle both old and new table names for backward compatibility
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGamePlaytimeStats')
        AND NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamGamePlaytimeStats') AND name LIKE '%GameId%')
    BEGIN
        BEGIN TRY
            ALTER TABLE dbo.SteamGamePlaytimeStats ADD CONSTRAINT UQ_SteamGamePlaytimeStats_GameId UNIQUE (GameId);
            SELECT 'Added UNIQUE constraint UQ_SteamGamePlaytimeStats_GameId' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not add UQ_SteamGamePlaytimeStats_GameId - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    -- Also handle old table name for backward compatibility
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamPlayerPlaytime')
        AND NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamPlayerPlaytime') AND name LIKE '%GameId%')
    BEGIN
        BEGIN TRY
            ALTER TABLE dbo.SteamPlayerPlaytime ADD CONSTRAINT UQ_SteamPlayerPlaytime_GameId UNIQUE (GameId);
            SELECT 'Added UNIQUE constraint UQ_SteamPlayerPlaytime_GameId' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not add UQ_SteamPlayerPlaytime_GameId - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    -- PRIMARY KEY for SteamAchievementStats
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamAchievementStats')
        AND NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamAchievementStats') AND type = 'PK')
    BEGIN
        BEGIN TRY
            ALTER TABLE dbo.SteamAchievementStats ADD CONSTRAINT PK_SteamAchievementStats PRIMARY KEY (AchievementId);
            SELECT 'Added PRIMARY KEY to SteamAchievementStats' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not add PRIMARY KEY to SteamAchievementStats - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    -- CHECK constraints
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamAchievementStats')
        AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('SteamAchievementStats') AND name = 'CK_SteamAchievementStats_Percentage')
    BEGIN
        BEGIN TRY
            ALTER TABLE dbo.SteamAchievementStats ADD CONSTRAINT CK_SteamAchievementStats_Percentage CHECK (GlobalPercentage BETWEEN 0 AND 100);
            SELECT 'Added CHECK constraint CK_SteamAchievementStats_Percentage' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not add CK_SteamAchievementStats_Percentage - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGamePrices')
        AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('SteamGamePrices') AND name = 'CK_SteamGamePrices_Discount')
    BEGIN
        BEGIN TRY
            ALTER TABLE dbo.SteamGamePrices ADD CONSTRAINT CK_SteamGamePrices_Discount CHECK (DiscountPercent BETWEEN 0 AND 100);
            SELECT 'Added CHECK constraint CK_SteamGamePrices_Discount' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not add CK_SteamGamePrices_Discount - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGameReviews')
        AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('SteamGameReviews') AND name = 'CK_SteamGameReviews_Metacritic')
    BEGIN
        BEGIN TRY
            ALTER TABLE dbo.SteamGameReviews ADD CONSTRAINT CK_SteamGameReviews_Metacritic CHECK (MetacriticScore BETWEEN 0 AND 100);
            SELECT 'Added CHECK constraint CK_SteamGameReviews_Metacritic' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not add CK_SteamGameReviews_Metacritic - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    SELECT 'Step 8 complete: Constraints added (some may have been skipped if errors occurred).' AS [Migration Status];
    
    -- Commit or roll back based on transaction state to avoid 3930 errors
    IF XACT_STATE() = 1
    BEGIN
        COMMIT TRANSACTION;
        SELECT 'Transaction committed successfully.' AS [Migration Status];
    END
    ELSE IF XACT_STATE() = -1
    BEGIN
        ROLLBACK TRANSACTION;
        SELECT 'Step 8 encountered an error and the transaction was rolled back.' AS [Migration Warning];
    END
    
END TRY
BEGIN CATCH
    DECLARE @errorMsg NVARCHAR(MAX) = ERROR_MESSAGE();
    SELECT 'Error occurred during Step 8:' AS [Migration Error];
    SELECT @errorMsg AS [Error Message];

    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;

    -- Do not re-throw; we've logged the error and cleaned up the transaction
END CATCH;
