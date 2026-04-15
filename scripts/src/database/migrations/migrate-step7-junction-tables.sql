-- STEP 7: Update junction tables (remove id columns, add composite primary keys)
-- This step removes id columns from junction tables and adds composite primary keys
-- Run this after Step 6 (updating types) is complete

BEGIN TRANSACTION;

BEGIN TRY
    SELECT 'Step 7: Updating junction tables...' AS [Migration Status];
    
    DECLARE @pkName NVARCHAR(128);
    
    -- SteamGamePlatforms
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGamePlatforms') AND name = 'id')
    BEGIN
        IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamGamePlatforms') AND type = 'PK')
        BEGIN
            SELECT @pkName = name FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamGamePlatforms') AND type = 'PK';
            EXEC('ALTER TABLE SteamGamePlatforms DROP CONSTRAINT ' + @pkName);
        END
        ALTER TABLE SteamGamePlatforms DROP COLUMN id;
        ALTER TABLE SteamGamePlatforms ADD PRIMARY KEY (GameId, PlatformId);
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamGamePlatforms') AND type = 'PK')
    BEGIN
        ALTER TABLE SteamGamePlatforms ADD PRIMARY KEY (GameId, PlatformId);
    END
    
    -- SteamGameGenres
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGameGenres') AND name = 'id')
    BEGIN
        IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamGameGenres') AND type = 'PK')
        BEGIN
            SELECT @pkName = name FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamGameGenres') AND type = 'PK';
            EXEC('ALTER TABLE SteamGameGenres DROP CONSTRAINT ' + @pkName);
        END
        ALTER TABLE SteamGameGenres DROP COLUMN id;
        ALTER TABLE SteamGameGenres ADD PRIMARY KEY (GameId, GenreId);
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamGameGenres') AND type = 'PK')
    BEGIN
        ALTER TABLE SteamGameGenres ADD PRIMARY KEY (GameId, GenreId);
    END
    
    -- SteamGameCategories
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGameCategories') AND name = 'id')
    BEGIN
        IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamGameCategories') AND type = 'PK')
        BEGIN
            SELECT @pkName = name FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamGameCategories') AND type = 'PK';
            EXEC('ALTER TABLE SteamGameCategories DROP CONSTRAINT ' + @pkName);
        END
        ALTER TABLE SteamGameCategories DROP COLUMN id;
        ALTER TABLE SteamGameCategories ADD PRIMARY KEY (GameId, CategoryId);
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamGameCategories') AND type = 'PK')
    BEGIN
        ALTER TABLE SteamGameCategories ADD PRIMARY KEY (GameId, CategoryId);
    END
    
    -- SteamGameTags
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGameTags') AND name = 'id')
    BEGIN
        IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamGameTags') AND type = 'PK')
        BEGIN
            SELECT @pkName = name FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamGameTags') AND type = 'PK';
            EXEC('ALTER TABLE SteamGameTags DROP CONSTRAINT ' + @pkName);
        END
        ALTER TABLE SteamGameTags DROP COLUMN id;
        ALTER TABLE SteamGameTags ADD PRIMARY KEY (GameId, TagId);
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamGameTags') AND type = 'PK')
    BEGIN
        ALTER TABLE SteamGameTags ADD PRIMARY KEY (GameId, TagId);
    END
    
    -- SteamGameLanguages
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGameLanguages') AND name = 'id')
    BEGIN
        IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamGameLanguages') AND type = 'PK')
        BEGIN
            SELECT @pkName = name FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamGameLanguages') AND type = 'PK';
            EXEC('ALTER TABLE SteamGameLanguages DROP CONSTRAINT ' + @pkName);
        END
        ALTER TABLE SteamGameLanguages DROP COLUMN id;
        ALTER TABLE SteamGameLanguages ADD PRIMARY KEY (GameId, LanguageId);
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamGameLanguages') AND type = 'PK')
    BEGIN
        ALTER TABLE SteamGameLanguages ADD PRIMARY KEY (GameId, LanguageId);
    END
    
    -- SteamGameDevelopers
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGameDevelopers') AND name = 'id')
    BEGIN
        IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamGameDevelopers') AND type = 'PK')
        BEGIN
            SELECT @pkName = name FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamGameDevelopers') AND type = 'PK';
            EXEC('ALTER TABLE SteamGameDevelopers DROP CONSTRAINT ' + @pkName);
        END
        ALTER TABLE SteamGameDevelopers DROP COLUMN id;
        ALTER TABLE SteamGameDevelopers ADD PRIMARY KEY (GameId, DeveloperId);
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamGameDevelopers') AND type = 'PK')
    BEGIN
        ALTER TABLE SteamGameDevelopers ADD PRIMARY KEY (GameId, DeveloperId);
    END
    
    -- SteamGamePublishers
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGamePublishers') AND name = 'id')
    BEGIN
        IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamGamePublishers') AND type = 'PK')
        BEGIN
            SELECT @pkName = name FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamGamePublishers') AND type = 'PK';
            EXEC('ALTER TABLE SteamGamePublishers DROP CONSTRAINT ' + @pkName);
        END
        ALTER TABLE SteamGamePublishers DROP COLUMN id;
        ALTER TABLE SteamGamePublishers ADD PRIMARY KEY (GameId, PublisherId);
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamGamePublishers') AND type = 'PK')
    BEGIN
        ALTER TABLE SteamGamePublishers ADD PRIMARY KEY (GameId, PublisherId);
    END
    
    SELECT 'Step 7 complete: Junction tables updated.' AS [Migration Status];
    
    COMMIT TRANSACTION;
    SELECT 'Transaction committed successfully.' AS [Migration Status];
    
END TRY
BEGIN CATCH
    DECLARE @errorMsg NVARCHAR(MAX) = ERROR_MESSAGE();
    SELECT 'Error occurred during Step 7:' AS [Migration Error];
    SELECT @errorMsg AS [Error Message];
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;

