-- Steam Achievement Tracker Database Schema
-- MSSQL Server Schema
-- Refactored to remove JSON columns and use proper relational tables

-- Steam Platform lookup table (limited set of values)
-- Note: Consider using CHECK constraint instead of separate table for very small sets
CREATE TABLE dbo.SteamPlatforms (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(50) UNIQUE NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

-- Steam Genre lookup table
CREATE TABLE dbo.SteamGenres (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) UNIQUE NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

-- Steam Category lookup table
CREATE TABLE dbo.SteamCategories (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) UNIQUE NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

-- Steam Tag lookup table
CREATE TABLE dbo.SteamTags (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) UNIQUE NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

-- Steam Language lookup table
CREATE TABLE dbo.SteamLanguages (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Code NVARCHAR(10) UNIQUE NOT NULL, -- ISO language code (e.g., 'en', 'fr', 'de')
    Name NVARCHAR(100) NOT NULL, -- Full language name (e.g., 'English', 'French', 'German')
    IsActive BIT NOT NULL DEFAULT 1
);

-- Steam Developer lookup table
CREATE TABLE dbo.SteamDevelopers (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(255) UNIQUE NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

-- Steam Publisher lookup table
CREATE TABLE dbo.SteamPublishers (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(255) UNIQUE NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

-- Steam Games table
CREATE TABLE dbo.SteamGames (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    SteamAppId INT NOT NULL,
    Name NVARCHAR(255) NOT NULL,
    ReleaseDate DATE,
    HeaderImageUrl NVARCHAR(500),
    ShortDescription NVARCHAR(2000),
    IsUnlisted BIT NOT NULL DEFAULT 0,
    IsRemoved BIT NOT NULL DEFAULT 0,
    MainStoryHours DECIMAL(10,2),
    MainSidesHours DECIMAL(10,2),
    CompletionistHours DECIMAL(10,2),
    AllStylesHours DECIMAL(10,2),
    Alias NVARCHAR(255),
    ScoreRank INT,
    MinOwners INT, -- Minimum owner count
    MaxOwners INT, -- Maximum owner count (NULL if exact number, otherwise represents range)
    PeakCcu INT,
    CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsActive BIT NOT NULL DEFAULT 1,
    CONSTRAINT UQ_SteamGames_SteamAppId UNIQUE (SteamAppId)
);

-- Junction tables for many-to-many relationships (composite primary keys, no id column)
CREATE TABLE dbo.SteamGamePlatforms (
    GameId INT NOT NULL,
    PlatformId INT NOT NULL,
    PRIMARY KEY (GameId, PlatformId),
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id) ON DELETE CASCADE,
    FOREIGN KEY (PlatformId) REFERENCES dbo.SteamPlatforms(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.SteamGameGenres (
    GameId INT NOT NULL,
    GenreId INT NOT NULL,
    PRIMARY KEY (GameId, GenreId),
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id) ON DELETE CASCADE,
    FOREIGN KEY (GenreId) REFERENCES dbo.SteamGenres(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.SteamGameCategories (
    GameId INT NOT NULL,
    CategoryId INT NOT NULL,
    PRIMARY KEY (GameId, CategoryId),
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id) ON DELETE CASCADE,
    FOREIGN KEY (CategoryId) REFERENCES dbo.SteamCategories(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.SteamGameTags (
    GameId INT NOT NULL,
    TagId INT NOT NULL,
    PRIMARY KEY (GameId, TagId),
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id) ON DELETE CASCADE,
    FOREIGN KEY (TagId) REFERENCES dbo.SteamTags(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.SteamGameLanguages (
    GameId INT NOT NULL,
    LanguageId INT NOT NULL,
    HasInterface BIT NOT NULL DEFAULT 0, -- Interface supported
    HasFullAudio BIT NOT NULL DEFAULT 0, -- Full audio supported
    HasSubtitles BIT NOT NULL DEFAULT 0, -- Subtitles supported
    PRIMARY KEY (GameId, LanguageId),
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id) ON DELETE CASCADE,
    FOREIGN KEY (LanguageId) REFERENCES dbo.SteamLanguages(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.SteamGameDevelopers (
    GameId INT NOT NULL,
    DeveloperId INT NOT NULL,
    PRIMARY KEY (GameId, DeveloperId),
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id) ON DELETE CASCADE,
    FOREIGN KEY (DeveloperId) REFERENCES dbo.SteamDevelopers(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.SteamGamePublishers (
    GameId INT NOT NULL,
    PublisherId INT NOT NULL,
    PRIMARY KEY (GameId, PublisherId),
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id) ON DELETE CASCADE,
    FOREIGN KEY (PublisherId) REFERENCES dbo.SteamPublishers(Id) ON DELETE CASCADE
);

-- Steam Achievements table
CREATE TABLE dbo.SteamAchievements (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    GameId INT NOT NULL,
    SteamApiName NVARCHAR(255) NOT NULL,
    Name NVARCHAR(255) NOT NULL,
    Description NVARCHAR(2000),
    IconUrl NVARCHAR(500),
    Points INT,
    IsHidden BIT NOT NULL DEFAULT 0,
    DescriptionSource NVARCHAR(50),
    LastUpdated DATETIME2,
    CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsActive BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id),
    CONSTRAINT UQ_SteamAchievements_GameId_SteamApiName UNIQUE (GameId, SteamApiName)
);

-- Steam Users table (matches SteamProfiles in backend)
CREATE TABLE dbo.SteamUsers (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    SteamId BIGINT NOT NULL,
    Username NVARCHAR(255) NOT NULL,
    ProfileUrl NVARCHAR(500),
    AvatarUrl NVARCHAR(500),
    IsActive BIT NOT NULL DEFAULT 1, -- Soft delete flag
    CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_SteamUsers_SteamId UNIQUE (SteamId)
);

-- Steam User achievements junction table
CREATE TABLE dbo.SteamUserAchievements (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    AchievementId INT NOT NULL,
    UnlockedAt DATETIME2 NOT NULL,
    CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (UserId) REFERENCES dbo.SteamUsers(Id),
    FOREIGN KEY (AchievementId) REFERENCES dbo.SteamAchievements(Id),
    CONSTRAINT UQ_SteamUserAchievements_UserId_AchievementId UNIQUE (UserId, AchievementId)
);

-- Steam User games table (tracks owned games and playtime)
CREATE TABLE dbo.SteamUserGames (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    GameId INT NOT NULL,
    PlaytimeForever INT NOT NULL DEFAULT 0, -- Total playtime in minutes
    Playtime2Weeks INT NOT NULL DEFAULT 0, -- Playtime in last 2 weeks in minutes
    LastPlayedAt DATETIME2,
    CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (UserId) REFERENCES dbo.SteamUsers(Id) ON DELETE CASCADE,
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id) ON DELETE CASCADE,
    CONSTRAINT UQ_SteamUserGames_UserId_GameId UNIQUE (UserId, GameId)
);

-- Global Steam achievement statistics
CREATE TABLE dbo.SteamAchievementStats (
    AchievementId INT PRIMARY KEY,
    GlobalPercentage DECIMAL(5,2) NOT NULL,
    UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (AchievementId) REFERENCES dbo.SteamAchievements(Id),
    CONSTRAINT CK_SteamAchievementStats_Percentage CHECK (GlobalPercentage BETWEEN 0 AND 100)
);

-- Steam Game prices table
CREATE TABLE dbo.SteamGamePrices (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    GameId INT NOT NULL,
    Price DECIMAL(18,2), -- Stored as decimal (consider storing as minor units/cents)
    OriginalPrice DECIMAL(18,2),
    DiscountPercent INT,
    CurrencyCode NVARCHAR(3) NOT NULL, -- ISO currency code (3 characters) for current (discounted) price
    OriginalCurrencyCode NVARCHAR(3) NOT NULL, -- ISO currency code for original price (derived from symbol/prefix)
    RecordedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id),
    CONSTRAINT CK_SteamGamePrices_Discount CHECK (DiscountPercent BETWEEN 0 AND 100)
);

-- Steam Game reviews table
CREATE TABLE dbo.SteamGameReviews (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    GameId INT NOT NULL,
    SteamRating INT,
    MetacriticScore INT,
    Recommendations INT,
    RecordedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id),
    CONSTRAINT CK_SteamGameReviews_Metacritic CHECK (MetacriticScore BETWEEN 0 AND 100)
);

-- Steam Game aggregated playtime statistics table
CREATE TABLE dbo.SteamGamePlaytimeStats (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    GameId INT NOT NULL UNIQUE,
    AverageForever INT,
    Average2Weeks INT,
    MedianForever INT,
    Median2Weeks INT,
    UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id)
);

-- Indexes for better performance
-- Note: Indexes on junction tables may be redundant due to PRIMARY KEY constraints, but kept for explicit query optimization

CREATE INDEX idx_SteamAchievements_GameId ON dbo.SteamAchievements(GameId);
CREATE INDEX idx_SteamAchievements_IsHidden ON dbo.SteamAchievements(IsHidden);

-- Index for user achievements by time (for latest achievements queries)
CREATE INDEX idx_SteamUserAchievements_UnlockedAt ON dbo.SteamUserAchievements(UnlockedAt DESC);

CREATE INDEX idx_SteamUserAchievements_AchievementId ON dbo.SteamUserAchievements(AchievementId);

CREATE INDEX idx_SteamUserGames_UserId ON dbo.SteamUserGames(UserId);
CREATE INDEX idx_SteamUserGames_GameId ON dbo.SteamUserGames(GameId);

CREATE INDEX idx_SteamUsers_IsActive ON dbo.SteamUsers(IsActive);

-- Index for latest check per game queries
        -- Index for latest price queries
CREATE INDEX idx_SteamGamePrices_GameId_RecordedAt ON dbo.SteamGamePrices(GameId, RecordedAt DESC);

CREATE INDEX idx_SteamGameReviews_GameId ON dbo.SteamGameReviews(GameId);

-- Lookup table indexes (may be redundant due to UNIQUE constraints, but kept for explicit query optimization)
CREATE INDEX idx_SteamPlatforms_Name ON dbo.SteamPlatforms(Name);
CREATE INDEX idx_SteamGenres_Name ON dbo.SteamGenres(Name);
CREATE INDEX idx_SteamCategories_Name ON dbo.SteamCategories(Name);
CREATE INDEX idx_SteamTags_Name ON dbo.SteamTags(Name);
CREATE INDEX idx_SteamLanguages_Code ON dbo.SteamLanguages(Code);
CREATE INDEX idx_SteamDevelopers_Name ON dbo.SteamDevelopers(Name);
CREATE INDEX idx_SteamPublishers_Name ON dbo.SteamPublishers(Name);

GO

-- Trigger to automatically update UpdateDate timestamp
CREATE TRIGGER trg_SteamGames_UpdateDate
ON dbo.SteamGames
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE g
    SET UpdateDate = GETUTCDATE()
    FROM dbo.SteamGames g
    INNER JOIN inserted i ON g.Id = i.Id;
END;
GO
