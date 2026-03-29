-- STEP 9: Add indexes
-- This step adds indexes for better performance
-- Run this after Step 8 (adding constraints) is complete
-- Note: Some redundant indexes have been removed (covered by UNIQUE constraints)

BEGIN TRANSACTION;

BEGIN TRY
    SELECT 'Step 9: Adding indexes...' AS [Migration Status];
    
    -- SteamAchievements indexes
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.SteamAchievements') AND name = 'idx_SteamAchievements_GameId')
    BEGIN
        BEGIN TRY
            CREATE INDEX idx_SteamAchievements_GameId ON dbo.SteamAchievements(GameId);
            SELECT 'Created index idx_SteamAchievements_GameId' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not create idx_SteamAchievements_GameId - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.SteamAchievements') AND name = 'idx_SteamAchievements_IsHidden')
    BEGIN
        BEGIN TRY
            CREATE INDEX idx_SteamAchievements_IsHidden ON dbo.SteamAchievements(IsHidden);
            SELECT 'Created index idx_SteamAchievements_IsHidden' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not create idx_SteamAchievements_IsHidden - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    -- SteamUserAchievements indexes
    -- Note: idx_SteamUserAchievements_UserId is redundant (covered by UNIQUE constraint), so it's not created
    
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.SteamUserAchievements') AND name = 'idx_SteamUserAchievements_UnlockedAt')
    BEGIN
        BEGIN TRY
            CREATE INDEX idx_SteamUserAchievements_UnlockedAt ON dbo.SteamUserAchievements(UnlockedAt DESC);
            SELECT 'Created index idx_SteamUserAchievements_UnlockedAt' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not create idx_SteamUserAchievements_UnlockedAt - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.SteamUserAchievements') AND name = 'idx_SteamUserAchievements_AchievementId')
    BEGIN
        BEGIN TRY
            CREATE INDEX idx_SteamUserAchievements_AchievementId ON dbo.SteamUserAchievements(AchievementId);
            SELECT 'Created index idx_SteamUserAchievements_AchievementId' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not create idx_SteamUserAchievements_AchievementId - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    -- SteamUserGames indexes (only if table exists)
    IF OBJECT_ID('dbo.SteamUserGames', 'U') IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.SteamUserGames') AND name = 'idx_SteamUserGames_UserId')
        BEGIN
            BEGIN TRY
                CREATE INDEX idx_SteamUserGames_UserId ON dbo.SteamUserGames(UserId);
                SELECT 'Created index idx_SteamUserGames_UserId' AS [Migration Status];
            END TRY
            BEGIN CATCH
                SELECT 'Warning: Could not create idx_SteamUserGames_UserId - ' + ERROR_MESSAGE() AS [Migration Warning];
            END CATCH
        END
        
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.SteamUserGames') AND name = 'idx_SteamUserGames_GameId')
        BEGIN
            BEGIN TRY
                CREATE INDEX idx_SteamUserGames_GameId ON dbo.SteamUserGames(GameId);
                SELECT 'Created index idx_SteamUserGames_GameId' AS [Migration Status];
            END TRY
            BEGIN CATCH
                SELECT 'Warning: Could not create idx_SteamUserGames_GameId - ' + ERROR_MESSAGE() AS [Migration Warning];
            END CATCH
        END
    END
    
    -- SteamUsers indexes
    -- Note: UQ_SteamUsers_SteamId index is redundant (covered by UNIQUE constraint), so it's not created
    
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.SteamUsers') AND name = 'idx_SteamUsers_IsActive')
    BEGIN
        BEGIN TRY
            CREATE INDEX idx_SteamUsers_IsActive ON dbo.SteamUsers(IsActive);
            SELECT 'Created index idx_SteamUsers_IsActive' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not create idx_SteamUsers_IsActive - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    -- SteamGamePrices indexes
    -- Replace single column index with composite index for latest price queries
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.SteamGamePrices') AND name = 'idx_SteamGamePrices_GameId')
    BEGIN
        BEGIN TRY
            DROP INDEX idx_SteamGamePrices_GameId ON dbo.SteamGamePrices;
            SELECT 'Dropped old index idx_SteamGamePrices_GameId' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not drop idx_SteamGamePrices_GameId - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.SteamGamePrices') AND name = 'idx_SteamGamePrices_GameId_RecordedAt')
    BEGIN
        BEGIN TRY
            CREATE INDEX idx_SteamGamePrices_GameId_RecordedAt ON dbo.SteamGamePrices(GameId, RecordedAt DESC);
            SELECT 'Created index idx_SteamGamePrices_GameId_RecordedAt' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not create idx_SteamGamePrices_GameId_RecordedAt - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    -- SteamGameReviews indexes
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.SteamGameReviews') AND name = 'idx_SteamGameReviews_GameId')
    BEGIN
        BEGIN TRY
            CREATE INDEX idx_SteamGameReviews_GameId ON dbo.SteamGameReviews(GameId);
            SELECT 'Created index idx_SteamGameReviews_GameId' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not create idx_SteamGameReviews_GameId - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    -- SteamGamePlaytimeStats indexes
    -- Note: idx_SteamGamePlaytimeStats_GameId is redundant (covered by UNIQUE constraint), so it's not created
    -- Handle both old and new table names for backward compatibility
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGamePlaytimeStats')
    BEGIN
        IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.SteamGamePlaytimeStats') AND name = 'idx_SteamGamePlaytimeStats_GameId')
        BEGIN
            BEGIN TRY
                DROP INDEX idx_SteamGamePlaytimeStats_GameId ON dbo.SteamGamePlaytimeStats;
                SELECT 'Dropped redundant index idx_SteamGamePlaytimeStats_GameId' AS [Migration Status];
            END TRY
            BEGIN CATCH
                SELECT 'Warning: Could not drop idx_SteamGamePlaytimeStats_GameId - ' + ERROR_MESSAGE() AS [Migration Warning];
            END CATCH
        END
    END
    
    -- Also handle old table name for backward compatibility
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamPlayerPlaytime')
    BEGIN
        IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.SteamPlayerPlaytime') AND name = 'idx_SteamPlayerPlaytime_GameId')
        BEGIN
            BEGIN TRY
                DROP INDEX idx_SteamPlayerPlaytime_GameId ON dbo.SteamPlayerPlaytime;
                SELECT 'Dropped redundant index idx_SteamPlayerPlaytime_GameId' AS [Migration Status];
            END TRY
            BEGIN CATCH
                SELECT 'Warning: Could not drop idx_SteamPlayerPlaytime_GameId - ' + ERROR_MESSAGE() AS [Migration Warning];
            END CATCH
        END
    END
    
    -- Lookup table indexes (may be redundant due to UNIQUE constraints, but kept for explicit query optimization)
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.SteamPlatforms') AND name = 'idx_SteamPlatforms_Name')
    BEGIN
        BEGIN TRY
            CREATE INDEX idx_SteamPlatforms_Name ON dbo.SteamPlatforms(Name);
            SELECT 'Created index idx_SteamPlatforms_Name' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not create idx_SteamPlatforms_Name - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.SteamGenres') AND name = 'idx_SteamGenres_Name')
    BEGIN
        BEGIN TRY
            CREATE INDEX idx_SteamGenres_Name ON dbo.SteamGenres(Name);
            SELECT 'Created index idx_SteamGenres_Name' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not create idx_SteamGenres_Name - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.SteamCategories') AND name = 'idx_SteamCategories_Name')
    BEGIN
        BEGIN TRY
            CREATE INDEX idx_SteamCategories_Name ON dbo.SteamCategories(Name);
            SELECT 'Created index idx_SteamCategories_Name' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not create idx_SteamCategories_Name - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.SteamTags') AND name = 'idx_SteamTags_Name')
    BEGIN
        BEGIN TRY
            CREATE INDEX idx_SteamTags_Name ON dbo.SteamTags(Name);
            SELECT 'Created index idx_SteamTags_Name' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not create idx_SteamTags_Name - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.SteamLanguages') AND name = 'idx_SteamLanguages_Code')
    BEGIN
        BEGIN TRY
            CREATE INDEX idx_SteamLanguages_Code ON dbo.SteamLanguages(Code);
            SELECT 'Created index idx_SteamLanguages_Code' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not create idx_SteamLanguages_Code - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.SteamDevelopers') AND name = 'idx_SteamDevelopers_Name')
    BEGIN
        BEGIN TRY
            CREATE INDEX idx_SteamDevelopers_Name ON dbo.SteamDevelopers(Name);
            SELECT 'Created index idx_SteamDevelopers_Name' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not create idx_SteamDevelopers_Name - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.SteamPublishers') AND name = 'idx_SteamPublishers_Name')
    BEGIN
        BEGIN TRY
            CREATE INDEX idx_SteamPublishers_Name ON dbo.SteamPublishers(Name);
            SELECT 'Created index idx_SteamPublishers_Name' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not create idx_SteamPublishers_Name - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    -- Remove redundant indexes that are covered by UNIQUE constraints
    -- Note: These should not exist if schema was created fresh, but we clean them up if they do
    
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.SteamUserAchievements') AND name = 'idx_SteamUserAchievements_UserId')
    BEGIN
        BEGIN TRY
            DROP INDEX idx_SteamUserAchievements_UserId ON dbo.SteamUserAchievements;
            SELECT 'Dropped redundant index idx_SteamUserAchievements_UserId (covered by UNIQUE constraint)' AS [Migration Status];
        END TRY
        BEGIN CATCH
            SELECT 'Warning: Could not drop idx_SteamUserAchievements_UserId - ' + ERROR_MESSAGE() AS [Migration Warning];
        END CATCH
    END
    
    -- Do NOT drop UQ_SteamUsers_SteamId or UQ_SteamGames_SteamAppId here:
    -- they are backing indexes for UNIQUE constraints defined in schema.sql.
    
    SELECT 'Step 9 complete: Indexes added and redundant indexes removed (some may have been skipped if errors occurred).' AS [Migration Status];
    
    -- Commit or roll back based on transaction state to avoid 3930 errors
    IF XACT_STATE() = 1
    BEGIN
        COMMIT TRANSACTION;
        SELECT 'Transaction committed successfully.' AS [Migration Status];
    END
    ELSE IF XACT_STATE() = -1
    BEGIN
        ROLLBACK TRANSACTION;
        SELECT 'Step 9 encountered an error and the transaction was rolled back.' AS [Migration Warning];
    END
    
END TRY
BEGIN CATCH
    DECLARE @errorMsg NVARCHAR(MAX) = ERROR_MESSAGE();
    SELECT 'Error occurred during Step 9:' AS [Migration Error];
    SELECT @errorMsg AS [Error Message];

    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;

    -- Do not re-throw; we've logged the error and cleaned up the transaction
END CATCH;

