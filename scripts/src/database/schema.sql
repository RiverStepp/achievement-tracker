-- Steam Achievement Tracker Database Schema
-- MSSQL Server Schema
-- Refactored to remove JSON columns and use proper relational tables

-- Steam Genre lookup table
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGenres' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[SteamGenres] (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(100) UNIQUE NOT NULL,
        CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        IsActive BIT NOT NULL DEFAULT 1
    );
END;
GO

-- Steam Category lookup table
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamCategories' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[SteamCategories] (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(100) UNIQUE NOT NULL,
        CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        IsActive BIT NOT NULL DEFAULT 1
    );
END;
GO

-- Steam Tag lookup table
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamTags' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[SteamTags] (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(100) UNIQUE NOT NULL,
        CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        IsActive BIT NOT NULL DEFAULT 1
    );
END;
GO

-- Steam Language lookup table
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamLanguages' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[SteamLanguages] (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Code NVARCHAR(3) UNIQUE NOT NULL, -- ISO language code (e.g., 'en', 'fr', 'de')
        [Name] NVARCHAR(100) NOT NULL, -- Full language name (e.g., 'English', 'French', 'German')
        CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        IsActive BIT NOT NULL DEFAULT 1
    );
END;
GO

-- Steam Developer lookup table
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamDevelopers' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[SteamDevelopers] (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(255) UNIQUE NOT NULL,
        PageUrl NVARCHAR(500),
        CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        IsActive BIT NOT NULL DEFAULT 1
    );
END;
GO

-- Steam Publisher lookup table
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamPublishers' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[SteamPublishers] (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(255) UNIQUE NOT NULL,
        PageUrl NVARCHAR(500), 
        CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        IsActive BIT NOT NULL DEFAULT 1
    );
END;
GO

-- Steam Games table
-- Note: Using Id as primary key instead of SteamAppId to allow for better foreign key relationships
-- SteamAppId is unique and indexed for lookups
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGames' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[SteamGames] (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        SteamAppId INT NOT NULL,
        [Name] NVARCHAR(255) NOT NULL,
        ReleaseDate DATE,
        HeaderImageUrl NVARCHAR(500),
        ShortDescription NVARCHAR(2000),
        IsUnlisted BIT NOT NULL DEFAULT 0,
        IsRemoved BIT NOT NULL DEFAULT 0,
        Alias NVARCHAR(255),
        CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        IsActive BIT NOT NULL DEFAULT 1,
        CONSTRAINT UQ_SteamGames_SteamAppId UNIQUE (SteamAppId)
    );
END;
GO

-- Junction tables for many-to-many relationships (composite primary keys, no id column)
-- Platform enum: 1=Windows, 2=Mac, 3=Linux
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGamePlatforms' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[SteamGamePlatforms] (
        GameId INT NOT NULL,
        [Platform] TINYINT NOT NULL, -- 1=Windows, 2=Mac, 3=Linux
        PRIMARY KEY (GameId, [Platform]),
        FOREIGN KEY (GameId) REFERENCES [dbo].[SteamGames](Id),
        CONSTRAINT CK_SteamGamePlatforms_Platform CHECK ([Platform] IN (1, 2, 3))
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGameGenres' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[SteamGameGenres] (
        GameId INT NOT NULL,
        GenreId INT NOT NULL,
        PRIMARY KEY (GameId, GenreId),
        FOREIGN KEY (GameId) REFERENCES [dbo].[SteamGames](Id),
        FOREIGN KEY (GenreId) REFERENCES [dbo].[SteamGenres](Id)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGameCategories' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[SteamGameCategories] (
        GameId INT NOT NULL,
        CategoryId INT NOT NULL,
        PRIMARY KEY (GameId, CategoryId),
        FOREIGN KEY (GameId) REFERENCES [dbo].[SteamGames](Id),
        FOREIGN KEY (CategoryId) REFERENCES [dbo].[SteamCategories](Id)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGameTags' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[SteamGameTags] (
        GameId INT NOT NULL,
        TagId INT NOT NULL,
        PRIMARY KEY (GameId, TagId),
        FOREIGN KEY (GameId) REFERENCES [dbo].[SteamGames](Id),
        FOREIGN KEY (TagId) REFERENCES [dbo].[SteamTags](Id)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGameLanguages' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[SteamGameLanguages] (
        GameId INT NOT NULL,
        LanguageId INT NOT NULL,
        HasInterface BIT NOT NULL DEFAULT 0, -- Interface supported
        HasFullAudio BIT NOT NULL DEFAULT 0, -- Full audio supported
        HasSubtitles BIT NOT NULL DEFAULT 0, -- Subtitles supported
        PRIMARY KEY (GameId, LanguageId),
        FOREIGN KEY (GameId) REFERENCES [dbo].[SteamGames](Id),
        FOREIGN KEY (LanguageId) REFERENCES [dbo].[SteamLanguages](Id)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGameDevelopers' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[SteamGameDevelopers] (
        GameId INT NOT NULL,
        DeveloperId INT NOT NULL,
        PRIMARY KEY (GameId, DeveloperId),
        FOREIGN KEY (GameId) REFERENCES [dbo].[SteamGames](Id),
        FOREIGN KEY (DeveloperId) REFERENCES [dbo].[SteamDevelopers](Id)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGamePublishers' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[SteamGamePublishers] (
        GameId INT NOT NULL,
        PublisherId INT NOT NULL,
        PRIMARY KEY (GameId, PublisherId),
        FOREIGN KEY (GameId) REFERENCES [dbo].[SteamGames](Id),
        FOREIGN KEY (PublisherId) REFERENCES [dbo].[SteamPublishers](Id)
    );
END;
GO

-- Steam Achievements table
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamAchievements' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[SteamAchievements] (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        GameId INT NOT NULL,
        SteamApiName NVARCHAR(255) NOT NULL,
        [Name] NVARCHAR(255) NOT NULL,
        [Description] NVARCHAR(2000),
        IconUrl NVARCHAR(500),
        Points INT NOT NULL DEFAULT 0,
        IsHidden BIT NOT NULL DEFAULT 0,
        DescriptionSource NVARCHAR(50),
        IsUnobtainable BIT NOT NULL DEFAULT 0,
        IsBuggy BIT NOT NULL DEFAULT 0,
        IsConditionallyObtainable BIT NOT NULL DEFAULT 0,
        IsMultiplayer BIT NOT NULL DEFAULT 0,
        IsMissable BIT NOT NULL DEFAULT 0,
        IsGrind BIT NOT NULL DEFAULT 0,
        IsRandom BIT NOT NULL DEFAULT 0,
        IsDateSpecific BIT NOT NULL DEFAULT 0,
        IsViral BIT NOT NULL DEFAULT 0,
        IsDLC BIT NOT NULL DEFAULT 0,
        IsWorldRecord BIT NOT NULL DEFAULT 0,
        CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        IsActive BIT NOT NULL DEFAULT 1,
        FOREIGN KEY (GameId) REFERENCES [dbo].[SteamGames](Id),
        CONSTRAINT UQ_SteamAchievements_GameId_SteamApiName UNIQUE (GameId, SteamApiName)
    );
END;
GO

-- Steam Profiles table (matches backend structure)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'UserSteamProfiles' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[UserSteamProfiles] (
        SteamId BIGINT PRIMARY KEY,
        PersonaName NVARCHAR(64),
        ProfileUrl NVARCHAR(256),
        AvatarSmallUrl NVARCHAR(256),
        AvatarMediumUrl NVARCHAR(256),
        AvatarFullUrl NVARCHAR(256),
        IsPrivate BIT NOT NULL DEFAULT 0,
        LastCheckedDate DATETIME2,
        LastSyncedDate DATETIME2,
        IsActive BIT NOT NULL DEFAULT 1,
        CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
END;
GO

-- Steam User achievements junction table
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamUserAchievements' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[SteamUserAchievements] (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        SteamId BIGINT NOT NULL, -- References UserSteamProfiles.SteamId
        AchievementId INT NOT NULL,
        UnlockedAt DATETIME2 NOT NULL, -- Timestamp required for cheat detection
        CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        IsActive BIT NOT NULL DEFAULT 1,
        FOREIGN KEY (SteamId) REFERENCES [dbo].[UserSteamProfiles](SteamId),
        FOREIGN KEY (AchievementId) REFERENCES [dbo].[SteamAchievements](Id),
        CONSTRAINT UQ_SteamUserAchievements_SteamId_AchievementId UNIQUE (SteamId, AchievementId)
    );
END;
GO

-- Steam User games table (tracks owned games and playtime)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamUserGames' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[SteamUserGames] (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        SteamId BIGINT NOT NULL, -- References UserSteamProfiles.SteamId
        GameId INT NOT NULL,
        PlaytimeForever INT NOT NULL DEFAULT 0, -- Total playtime in minutes
        LastPlayedAt DATETIME2,
        CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        IsActive BIT NOT NULL DEFAULT 1,
        FOREIGN KEY (SteamId) REFERENCES [dbo].[UserSteamProfiles](SteamId),
        FOREIGN KEY (GameId) REFERENCES [dbo].[SteamGames](Id),
        CONSTRAINT UQ_SteamUserGames_SteamId_GameId UNIQUE (SteamId, GameId)
    );
END;
GO

-- Global Steam achievement statistics
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamAchievementStats' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[SteamAchievementStats] (
        AchievementId INT PRIMARY KEY,
        GlobalPercentage DECIMAL(5,2) NOT NULL,
        UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY (AchievementId) REFERENCES [dbo].[SteamAchievements](Id),
        CONSTRAINT CK_SteamAchievementStats_Percentage CHECK (GlobalPercentage BETWEEN 0 AND 100)
    );
END;
GO

-- Steam Game prices table
-- No uniqueness constraint to allow price history tracking over time
-- Using DECIMAL(18,3) to support most currencies
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGamePrices' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[SteamGamePrices] (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        GameId INT NOT NULL,
        Price DECIMAL(18,3) NOT NULL,
        OriginalPrice DECIMAL(18,3) NOT NULL,
        CurrencyCode NVARCHAR(3) NOT NULL, -- ISO currency code for current (discounted) price
        OriginalCurrencyCode NVARCHAR(3) NOT NULL, -- ISO currency code for original price
        RecordedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY (GameId) REFERENCES [dbo].[SteamGames](Id)
    );
END;
GO

-- Steam Game reviews table
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGameReviews' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[SteamGameReviews] (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        GameId INT NOT NULL,
        SteamRating INT NOT NULL,
        MetacriticScore INT,
        Recommendations INT,
        RecordedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY (GameId) REFERENCES [dbo].[SteamGames](Id),
        CONSTRAINT CK_SteamGameReviews_Metacritic CHECK (MetacriticScore IS NULL OR MetacriticScore BETWEEN 0 AND 100)
    );
END;
GO

-- Indexes for better performance
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_SteamGames_Name' AND object_id = OBJECT_ID('[dbo].[SteamGames]'))
BEGIN
    CREATE INDEX idx_SteamGames_Name ON [dbo].[SteamGames]([Name]);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_SteamAchievements_GameId' AND object_id = OBJECT_ID('[dbo].[SteamAchievements]'))
BEGIN
    CREATE INDEX idx_SteamAchievements_GameId ON [dbo].[SteamAchievements](GameId);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_SteamAchievements_IsHidden' AND object_id = OBJECT_ID('[dbo].[SteamAchievements]'))
BEGIN
    CREATE INDEX idx_SteamAchievements_IsHidden ON [dbo].[SteamAchievements](IsHidden);
END;
GO

-- Index for user achievements by time (for latest achievements queries)
-- Composite index for efficient queries filtering by user and sorting by unlock time
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_SteamUserAchievements_SteamId_UnlockedAt' AND object_id = OBJECT_ID('[dbo].[SteamUserAchievements]'))
BEGIN
    CREATE INDEX idx_SteamUserAchievements_SteamId_UnlockedAt ON [dbo].[SteamUserAchievements](SteamId, UnlockedAt DESC);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_SteamUserAchievements_AchievementId' AND object_id = OBJECT_ID('[dbo].[SteamUserAchievements]'))
BEGIN
    CREATE INDEX idx_SteamUserAchievements_AchievementId ON [dbo].[SteamUserAchievements](AchievementId);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_SteamUserGames_SteamId' AND object_id = OBJECT_ID('[dbo].[SteamUserGames]'))
BEGIN
    CREATE INDEX idx_SteamUserGames_SteamId ON [dbo].[SteamUserGames](SteamId);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_SteamUserGames_GameId' AND object_id = OBJECT_ID('[dbo].[SteamUserGames]'))
BEGIN
    CREATE INDEX idx_SteamUserGames_GameId ON [dbo].[SteamUserGames](GameId);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_UserSteamProfiles_IsActive' AND object_id = OBJECT_ID('[dbo].[UserSteamProfiles]'))
BEGIN
    CREATE INDEX idx_UserSteamProfiles_IsActive ON [dbo].[UserSteamProfiles](IsActive);
END;
GO

-- Index for latest price queries
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_SteamGamePrices_GameId_RecordedAt' AND object_id = OBJECT_ID('[dbo].[SteamGamePrices]'))
BEGIN
    CREATE INDEX idx_SteamGamePrices_GameId_RecordedAt ON [dbo].[SteamGamePrices](GameId, RecordedAt DESC);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_SteamGameReviews_GameId' AND object_id = OBJECT_ID('[dbo].[SteamGameReviews]'))
BEGIN
    CREATE INDEX idx_SteamGameReviews_GameId ON [dbo].[SteamGameReviews](GameId);
END;
GO

-- Indexes in junction tables for common queries
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_SteamGameGenres_GenreId' AND object_id = OBJECT_ID('[dbo].[SteamGameGenres]'))
BEGIN
    CREATE INDEX idx_SteamGameGenres_GenreId ON [dbo].[SteamGameGenres](GenreId);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_SteamGameCategories_CategoryId' AND object_id = OBJECT_ID('[dbo].[SteamGameCategories]'))
BEGIN
    CREATE INDEX idx_SteamGameCategories_CategoryId ON [dbo].[SteamGameCategories](CategoryId);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_SteamGameTags_TagId' AND object_id = OBJECT_ID('[dbo].[SteamGameTags]'))
BEGIN
    CREATE INDEX idx_SteamGameTags_TagId ON [dbo].[SteamGameTags](TagId);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_SteamGameLanguages_LanguageId' AND object_id = OBJECT_ID('[dbo].[SteamGameLanguages]'))
BEGIN
    CREATE INDEX idx_SteamGameLanguages_LanguageId ON [dbo].[SteamGameLanguages](LanguageId);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_SteamGameDevelopers_DeveloperId' AND object_id = OBJECT_ID('[dbo].[SteamGameDevelopers]'))
BEGIN
    CREATE INDEX idx_SteamGameDevelopers_DeveloperId ON [dbo].[SteamGameDevelopers](DeveloperId);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_SteamGamePublishers_PublisherId' AND object_id = OBJECT_ID('[dbo].[SteamGamePublishers]'))
BEGIN
    CREATE INDEX idx_SteamGamePublishers_PublisherId ON [dbo].[SteamGamePublishers](PublisherId);
END;
GO