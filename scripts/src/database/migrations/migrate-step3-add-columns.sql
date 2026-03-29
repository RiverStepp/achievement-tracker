-- STEP 3: Add missing columns (CreateDate, UpdateDate, IsActive)
-- This step adds CreateDate, UpdateDate, and IsActive columns to tables that need them
-- Run this after Step 2 (column renaming) is complete

BEGIN TRANSACTION;

BEGIN TRY
    SELECT 'Step 3: Adding missing columns...' AS [Migration Status];
    
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'CreateDate')
        ALTER TABLE SteamGames ADD CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE();
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'UpdateDate')
        ALTER TABLE SteamGames ADD UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE();
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'IsActive')
        ALTER TABLE SteamGames ADD IsActive BIT NOT NULL DEFAULT 1;
    
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievements') AND name = 'CreateDate')
        ALTER TABLE SteamAchievements ADD CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE();
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievements') AND name = 'UpdateDate')
        ALTER TABLE SteamAchievements ADD UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE();
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievements') AND name = 'IsActive')
        ALTER TABLE SteamAchievements ADD IsActive BIT NOT NULL DEFAULT 1;
    
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUsers') AND name = 'CreateDate')
        ALTER TABLE SteamUsers ADD CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE();
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUsers') AND name = 'UpdateDate')
        ALTER TABLE SteamUsers ADD UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE();
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUsers') AND name = 'IsActive')
        ALTER TABLE SteamUsers ADD IsActive BIT NOT NULL DEFAULT 1;
    
    SELECT 'Step 3 complete: Missing columns added.' AS [Migration Status];
    
    COMMIT TRANSACTION;
    SELECT 'Transaction committed successfully.' AS [Migration Status];
    
END TRY
BEGIN CATCH
    DECLARE @errorMsg NVARCHAR(MAX) = ERROR_MESSAGE();
    SELECT 'Error occurred during Step 3:' AS [Migration Error];
    SELECT @errorMsg AS [Error Message];
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;

-- Step 3b: remove extra CreateDate/UpdateDate from lookup tables

BEGIN TRANSACTION;

BEGIN TRY
    SELECT 'Step 3b: Removing extra columns...' AS [Migration Status];
    
    DECLARE @constraintName NVARCHAR(128);
    DECLARE @sql NVARCHAR(MAX);
    
    -- SteamPlatforms
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamPlatforms') AND name = 'CreateDate')
    BEGIN
        SELECT @constraintName = name FROM sys.default_constraints 
        WHERE parent_object_id = OBJECT_ID('SteamPlatforms') 
        AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('SteamPlatforms') AND name = 'CreateDate');
        IF @constraintName IS NOT NULL
        BEGIN
            SET @sql = 'ALTER TABLE SteamPlatforms DROP CONSTRAINT ' + QUOTENAME(@constraintName);
            EXEC sp_executesql @sql;
        END
        ALTER TABLE SteamPlatforms DROP COLUMN CreateDate;
    END
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamPlatforms') AND name = 'UpdateDate')
    BEGIN
        SELECT @constraintName = name FROM sys.default_constraints 
        WHERE parent_object_id = OBJECT_ID('SteamPlatforms') 
        AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('SteamPlatforms') AND name = 'UpdateDate');
        IF @constraintName IS NOT NULL
        BEGIN
            SET @sql = 'ALTER TABLE SteamPlatforms DROP CONSTRAINT ' + QUOTENAME(@constraintName);
            EXEC sp_executesql @sql;
        END
        ALTER TABLE SteamPlatforms DROP COLUMN UpdateDate;
    END
    
    -- SteamGenres
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGenres') AND name = 'CreateDate')
    BEGIN
        SELECT @constraintName = name FROM sys.default_constraints 
        WHERE parent_object_id = OBJECT_ID('SteamGenres') 
        AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('SteamGenres') AND name = 'CreateDate');
        IF @constraintName IS NOT NULL
        BEGIN
            SET @sql = 'ALTER TABLE SteamGenres DROP CONSTRAINT ' + QUOTENAME(@constraintName);
            EXEC sp_executesql @sql;
        END
        ALTER TABLE SteamGenres DROP COLUMN CreateDate;
    END
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGenres') AND name = 'UpdateDate')
    BEGIN
        SELECT @constraintName = name FROM sys.default_constraints 
        WHERE parent_object_id = OBJECT_ID('SteamGenres') 
        AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('SteamGenres') AND name = 'UpdateDate');
        IF @constraintName IS NOT NULL
        BEGIN
            SET @sql = 'ALTER TABLE SteamGenres DROP CONSTRAINT ' + QUOTENAME(@constraintName);
            EXEC sp_executesql @sql;
        END
        ALTER TABLE SteamGenres DROP COLUMN UpdateDate;
    END
    
    -- SteamCategories
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamCategories') AND name = 'CreateDate')
    BEGIN
        SELECT @constraintName = name FROM sys.default_constraints 
        WHERE parent_object_id = OBJECT_ID('SteamCategories') 
        AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('SteamCategories') AND name = 'CreateDate');
        IF @constraintName IS NOT NULL
        BEGIN
            SET @sql = 'ALTER TABLE SteamCategories DROP CONSTRAINT ' + QUOTENAME(@constraintName);
            EXEC sp_executesql @sql;
        END
        ALTER TABLE SteamCategories DROP COLUMN CreateDate;
    END
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamCategories') AND name = 'UpdateDate')
    BEGIN
        SELECT @constraintName = name FROM sys.default_constraints 
        WHERE parent_object_id = OBJECT_ID('SteamCategories') 
        AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('SteamCategories') AND name = 'UpdateDate');
        IF @constraintName IS NOT NULL
        BEGIN
            SET @sql = 'ALTER TABLE SteamCategories DROP CONSTRAINT ' + QUOTENAME(@constraintName);
            EXEC sp_executesql @sql;
        END
        ALTER TABLE SteamCategories DROP COLUMN UpdateDate;
    END
    
    -- SteamTags
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamTags') AND name = 'CreateDate')
    BEGIN
        SELECT @constraintName = name FROM sys.default_constraints 
        WHERE parent_object_id = OBJECT_ID('SteamTags') 
        AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('SteamTags') AND name = 'CreateDate');
        IF @constraintName IS NOT NULL
        BEGIN
            SET @sql = 'ALTER TABLE SteamTags DROP CONSTRAINT ' + QUOTENAME(@constraintName);
            EXEC sp_executesql @sql;
        END
        ALTER TABLE SteamTags DROP COLUMN CreateDate;
    END
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamTags') AND name = 'UpdateDate')
    BEGIN
        SELECT @constraintName = name FROM sys.default_constraints 
        WHERE parent_object_id = OBJECT_ID('SteamTags') 
        AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('SteamTags') AND name = 'UpdateDate');
        IF @constraintName IS NOT NULL
        BEGIN
            SET @sql = 'ALTER TABLE SteamTags DROP CONSTRAINT ' + QUOTENAME(@constraintName);
            EXEC sp_executesql @sql;
        END
        ALTER TABLE SteamTags DROP COLUMN UpdateDate;
    END
    
    -- SteamLanguages
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamLanguages') AND name = 'CreateDate')
    BEGIN
        SELECT @constraintName = name FROM sys.default_constraints 
        WHERE parent_object_id = OBJECT_ID('SteamLanguages') 
        AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('SteamLanguages') AND name = 'CreateDate');
        IF @constraintName IS NOT NULL
        BEGIN
            SET @sql = 'ALTER TABLE SteamLanguages DROP CONSTRAINT ' + QUOTENAME(@constraintName);
            EXEC sp_executesql @sql;
        END
        ALTER TABLE SteamLanguages DROP COLUMN CreateDate;
    END
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamLanguages') AND name = 'UpdateDate')
    BEGIN
        SELECT @constraintName = name FROM sys.default_constraints 
        WHERE parent_object_id = OBJECT_ID('SteamLanguages') 
        AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('SteamLanguages') AND name = 'UpdateDate');
        IF @constraintName IS NOT NULL
        BEGIN
            SET @sql = 'ALTER TABLE SteamLanguages DROP CONSTRAINT ' + QUOTENAME(@constraintName);
            EXEC sp_executesql @sql;
        END
        ALTER TABLE SteamLanguages DROP COLUMN UpdateDate;
    END
    
    -- SteamDevelopers
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamDevelopers') AND name = 'CreateDate')
    BEGIN
        SELECT @constraintName = name FROM sys.default_constraints 
        WHERE parent_object_id = OBJECT_ID('SteamDevelopers') 
        AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('SteamDevelopers') AND name = 'CreateDate');
        IF @constraintName IS NOT NULL
        BEGIN
            SET @sql = 'ALTER TABLE SteamDevelopers DROP CONSTRAINT ' + QUOTENAME(@constraintName);
            EXEC sp_executesql @sql;
        END
        ALTER TABLE SteamDevelopers DROP COLUMN CreateDate;
    END
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamDevelopers') AND name = 'UpdateDate')
    BEGIN
        SELECT @constraintName = name FROM sys.default_constraints 
        WHERE parent_object_id = OBJECT_ID('SteamDevelopers') 
        AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('SteamDevelopers') AND name = 'UpdateDate');
        IF @constraintName IS NOT NULL
        BEGIN
            SET @sql = 'ALTER TABLE SteamDevelopers DROP CONSTRAINT ' + QUOTENAME(@constraintName);
            EXEC sp_executesql @sql;
        END
        ALTER TABLE SteamDevelopers DROP COLUMN UpdateDate;
    END
    
    -- SteamPublishers
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamPublishers') AND name = 'CreateDate')
    BEGIN
        SELECT @constraintName = name FROM sys.default_constraints 
        WHERE parent_object_id = OBJECT_ID('SteamPublishers') 
        AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('SteamPublishers') AND name = 'CreateDate');
        IF @constraintName IS NOT NULL
        BEGIN
            SET @sql = 'ALTER TABLE SteamPublishers DROP CONSTRAINT ' + QUOTENAME(@constraintName);
            EXEC sp_executesql @sql;
        END
        ALTER TABLE SteamPublishers DROP COLUMN CreateDate;
    END
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamPublishers') AND name = 'UpdateDate')
    BEGIN
        SELECT @constraintName = name FROM sys.default_constraints 
        WHERE parent_object_id = OBJECT_ID('SteamPublishers') 
        AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('SteamPublishers') AND name = 'UpdateDate');
        IF @constraintName IS NOT NULL
        BEGIN
            SET @sql = 'ALTER TABLE SteamPublishers DROP CONSTRAINT ' + QUOTENAME(@constraintName);
            EXEC sp_executesql @sql;
        END
        ALTER TABLE SteamPublishers DROP COLUMN UpdateDate;
    END
    
    SELECT 'Step 3b complete: Extra columns removed.' AS [Migration Status];
    
    COMMIT TRANSACTION;
    SELECT 'Transaction committed successfully.' AS [Migration Status];
    
END TRY
BEGIN CATCH
    DECLARE @errorMsg NVARCHAR(MAX) = ERROR_MESSAGE();
    SELECT 'Error occurred during Step 3b:' AS [Migration Error];
    SELECT @errorMsg AS [Error Message];
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;

