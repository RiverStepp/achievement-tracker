-- Steam Achievement Tracker Database Schema
-- MSSQL Server Schema
-- Refactored to remove JSON columns and use proper relational tables

-- Steam Genre lookup table
CREATE TABLE dbo.SteamGenres (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    [Name] NVARCHAR(100) UNIQUE NOT NULL,
    CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsActive BIT NOT NULL DEFAULT 1
);

-- Steam Category lookup table
CREATE TABLE dbo.SteamCategories (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    [Name] NVARCHAR(100) UNIQUE NOT NULL,
    CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsActive BIT NOT NULL DEFAULT 1
);

-- Steam Tag lookup table
CREATE TABLE dbo.SteamTags (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    [Name] NVARCHAR(100) UNIQUE NOT NULL,
    CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsActive BIT NOT NULL DEFAULT 1
);

-- Steam Language lookup table
CREATE TABLE dbo.SteamLanguages (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Code NVARCHAR(3) UNIQUE NOT NULL, -- ISO language code (e.g., 'en', 'fr', 'de')
    [Name] NVARCHAR(100) NOT NULL, -- Full language name (e.g., 'English', 'French', 'German')
    CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsActive BIT NOT NULL DEFAULT 1
);

-- Steam Developer lookup table
CREATE TABLE dbo.SteamDevelopers (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    [Name] NVARCHAR(255) UNIQUE NOT NULL,
    PageUrl NVARCHAR(500),
    CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsActive BIT NOT NULL DEFAULT 1
);

-- Steam Publisher lookup table
CREATE TABLE dbo.SteamPublishers (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    [Name] NVARCHAR(255) UNIQUE NOT NULL,
    PageUrl NVARCHAR(500), 
    CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsActive BIT NOT NULL DEFAULT 1
);

-- Steam Games table
-- Note: Using Id as primary key instead of SteamAppId to allow for better foreign key relationships
-- SteamAppId is unique and indexed for lookups
CREATE TABLE dbo.SteamGames (
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

-- Junction tables for many-to-many relationships (composite primary keys, no id column)
-- Platform enum: 1=Windows, 2=Mac, 3=Linux
CREATE TABLE dbo.SteamGamePlatforms (
    GameId INT NOT NULL,
    [Platform] TINYINT NOT NULL, -- 1=Windows, 2=Mac, 3=Linux
    PRIMARY KEY (GameId, [Platform]),
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id),
    CONSTRAINT CK_SteamGamePlatforms_Platform CHECK ([Platform] IN (1, 2, 3))
);

CREATE TABLE dbo.SteamGameGenres (
    GameId INT NOT NULL,
    GenreId INT NOT NULL,
    PRIMARY KEY (GameId, GenreId),
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id),
    FOREIGN KEY (GenreId) REFERENCES dbo.SteamGenres(Id)
);

CREATE TABLE dbo.SteamGameCategories (
    GameId INT NOT NULL,
    CategoryId INT NOT NULL,
    PRIMARY KEY (GameId, CategoryId),
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id),
    FOREIGN KEY (CategoryId) REFERENCES dbo.SteamCategories(Id)
);

CREATE TABLE dbo.SteamGameTags (
    GameId INT NOT NULL,
    TagId INT NOT NULL,
    PRIMARY KEY (GameId, TagId),
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id),
    FOREIGN KEY (TagId) REFERENCES dbo.SteamTags(Id)
);

CREATE TABLE dbo.SteamGameLanguages (
    GameId INT NOT NULL,
    LanguageId INT NOT NULL,
    HasInterface BIT NOT NULL DEFAULT 0, -- Interface supported
    HasFullAudio BIT NOT NULL DEFAULT 0, -- Full audio supported
    HasSubtitles BIT NOT NULL DEFAULT 0, -- Subtitles supported
    PRIMARY KEY (GameId, LanguageId),
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id),
    FOREIGN KEY (LanguageId) REFERENCES dbo.SteamLanguages(Id)
);

CREATE TABLE dbo.SteamGameDevelopers (
    GameId INT NOT NULL,
    DeveloperId INT NOT NULL,
    PRIMARY KEY (GameId, DeveloperId),
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id),
    FOREIGN KEY (DeveloperId) REFERENCES dbo.SteamDevelopers(Id)
);

CREATE TABLE dbo.SteamGamePublishers (
    GameId INT NOT NULL,
    PublisherId INT NOT NULL,
    PRIMARY KEY (GameId, PublisherId),
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id),
    FOREIGN KEY (PublisherId) REFERENCES dbo.SteamPublishers(Id)
);

-- Steam Achievements table
CREATE TABLE dbo.SteamAchievements (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    GameId INT NOT NULL,
    SteamApiName NVARCHAR(255) NOT NULL,
    [Name] NVARCHAR(255) NOT NULL,
    [Description] NVARCHAR(2000),
    IconUrl NVARCHAR(500),
    Points INT NOT NULL DEFAULT 0,
    IsHidden BIT NOT NULL DEFAULT 0,
    DescriptionSource NVARCHAR(50),
    LastUpdated DATETIME2,
    CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsActive BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id),
    CONSTRAINT UQ_SteamAchievements_GameId_SteamApiName UNIQUE (GameId, SteamApiName)
);

-- Steam Profiles table (matches backend structure)
CREATE TABLE dbo.SteamProfiles (
    SteamId BIGINT PRIMARY KEY,
    UserExternalLoginId INT, -- Links to UserExternalLogins table
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
    UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (UserExternalLoginId) REFERENCES dbo.UserExternalLogins(UserExternalLoginId)
);

-- Steam User achievements junction table
CREATE TABLE dbo.SteamUserAchievements (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId BIGINT NOT NULL, -- References SteamProfiles.SteamId
    AchievementId INT NOT NULL,
    UnlockedAt DATETIME2 NOT NULL, -- Timestamp required for cheat detection
    CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsActive BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (UserId) REFERENCES dbo.SteamProfiles(SteamId),
    FOREIGN KEY (AchievementId) REFERENCES dbo.SteamAchievements(Id),
    CONSTRAINT UQ_SteamUserAchievements_UserId_AchievementId UNIQUE (UserId, AchievementId)
);

-- Steam User games table (tracks owned games and playtime)
CREATE TABLE dbo.SteamUserGames (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId BIGINT NOT NULL, -- References SteamProfiles.SteamId
    GameId INT NOT NULL,
    PlaytimeForever INT NOT NULL DEFAULT 0, -- Total playtime in minutes
    LastPlayedAt DATETIME2,
    CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsActive BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (UserId) REFERENCES dbo.SteamProfiles(SteamId),
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id),
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

-- FRONTEND / APPLICATION TABLES
-- These tables support the web application frontend features.
-- Core application user table (authentication layer)
CREATE TABLE dbo.AppUsers (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(255) NOT NULL,
    PasswordHash NVARCHAR(255), -- NULL if using OAuth only
    EmailVerified BIT NOT NULL DEFAULT 0,
    LastLoginAt DATETIME2,
    FailedLoginAttempts INT NOT NULL DEFAULT 0,
    LockedUntil DATETIME2,
    CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsActive BIT NOT NULL DEFAULT 1,
    CONSTRAINT UQ_AppUsers_Email UNIQUE (Email)
);

-- UserExternalLogins table (matches backend structure)
-- Links AppUsers to external authentication providers (Steam, etc.)
CREATE TABLE dbo.UserExternalLogins (
    UserExternalLoginId INT IDENTITY(1,1) PRIMARY KEY,
    AppUserId INT NOT NULL,
    AuthProvider SMALLINT NOT NULL, -- Enum: 1=Steam, etc.
    ProviderUserId NVARCHAR(64) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (AppUserId) REFERENCES dbo.AppUsers(Id),
    CONSTRAINT UQ_UserExternalLogins_AppUserId_AuthProvider UNIQUE (AppUserId, AuthProvider),
    CONSTRAINT UQ_UserExternalLogins_AuthProvider_ProviderUserId UNIQUE (AuthProvider, ProviderUserId)
);

-- User profile for display and customization
CREATE TABLE dbo.UserProfiles (
    UserId INT PRIMARY KEY,
    Handle NVARCHAR(50) NOT NULL,
    DisplayName NVARCHAR(100),
    AvatarUrl NVARCHAR(500),
    BannerUrl NVARCHAR(500),
    Bio NVARCHAR(1000),
    Location NVARCHAR(100),
    Timezone NVARCHAR(50),
    Pronouns NVARCHAR(50),
    OnboardingCompleted BIT NOT NULL DEFAULT 0,
    CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (UserId) REFERENCES dbo.AppUsers(Id),
    CONSTRAINT UQ_UserProfiles_Handle UNIQUE (Handle)
);

-- Privacy settings for user profile
CREATE TABLE dbo.UserProfilePrivacy (
    UserId INT PRIMARY KEY,
    ShowStats BIT NOT NULL DEFAULT 1,
    ShowActivity BIT NOT NULL DEFAULT 1,
    ShowConnections BIT NOT NULL DEFAULT 1,
    ShowSocialLinks BIT NOT NULL DEFAULT 1,
    ShowFeed BIT NOT NULL DEFAULT 1,
    ShowGameLibrary BIT NOT NULL DEFAULT 1,
    ShowAchievements BIT NOT NULL DEFAULT 1,
    AllowFollowers BIT NOT NULL DEFAULT 1,
    CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (UserId) REFERENCES dbo.UserProfiles(UserId)
);

-- Social links on user profile (Twitter, YouTube, Twitch, etc.)
CREATE TABLE dbo.UserSocialLinks (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Kind NVARCHAR(50) NOT NULL, -- 'twitter', 'youtube', 'twitch', 'discord', 'website', etc.
    Url NVARCHAR(500) NOT NULL,
    Position INT NOT NULL DEFAULT 0,
    CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (UserId) REFERENCES dbo.UserProfiles(UserId),
    CONSTRAINT UQ_UserSocialLinks_UserId_Kind UNIQUE (UserId, Kind)
);

-- User's favorite games (showcased on profile)
CREATE TABLE dbo.UserFavoriteGames (
    UserId INT NOT NULL,
    GameId INT NOT NULL,
    Position INT NOT NULL DEFAULT 0,
    CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    PRIMARY KEY (UserId, GameId),
    FOREIGN KEY (UserId) REFERENCES dbo.UserProfiles(UserId),
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id)
);

-- User's pinned achievements (showcased on profile)
CREATE TABLE dbo.UserPinnedAchievements (
    UserId INT NOT NULL,
    UserAchievementId INT NOT NULL,
    Position INT NOT NULL,
    PinnedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    PRIMARY KEY (UserId, UserAchievementId),
    FOREIGN KEY (UserId) REFERENCES dbo.UserProfiles(UserId),
    FOREIGN KEY (UserAchievementId) REFERENCES dbo.SteamUserAchievements(Id), 
    CONSTRAINT UQ_UserPinnedAchievements_UserId_Position UNIQUE (UserId, Position)
);

-- Social follows (user A follows user B)
CREATE TABLE dbo.UserFollows (
    FollowerId INT NOT NULL,
    FollowingId INT NOT NULL,
    FollowedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    PRIMARY KEY (FollowerId, FollowingId),
    FOREIGN KEY (FollowerId) REFERENCES dbo.UserProfiles(UserId),
    FOREIGN KEY (FollowingId) REFERENCES dbo.UserProfiles(UserId),
    CONSTRAINT CK_UserFollows_NoSelfFollow CHECK (FollowerId <> FollowingId)
);

-- Activity feed entries (normalized)
CREATE TABLE dbo.UserActivities (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    ActivityType NVARCHAR(50) NOT NULL, -- 'achievement_unlocked', 'game_started', 'game_completed', 'milestone_reached', 'profile_updated'
    GameId INT, -- Optional, if activity relates to a game
    AchievementId INT, -- Optional, if activity relates to an achievement
    MilestoneId INT, -- Optional, if activity relates to a milestone
    RelatedUserId INT, -- Optional, if activity involves another user
    IsPublic BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (UserId) REFERENCES dbo.AppUsers(Id),
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id),
    FOREIGN KEY (AchievementId) REFERENCES dbo.SteamAchievements(Id),
    FOREIGN KEY (MilestoneId) REFERENCES dbo.Milestones(Id),
    FOREIGN KEY (RelatedUserId) REFERENCES dbo.AppUsers(Id)
);

-- User notifications (template - will be changed)
CREATE TABLE dbo.UserNotifications (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    NotificationType NVARCHAR(50) NOT NULL, -- 'new_follower', 'achievement_milestone', 'friend_activity', 'system'
    Title NVARCHAR(255) NOT NULL,
    Body NVARCHAR(1000),
    ActionUrl NVARCHAR(500), -- Optional link
    RelatedUserId INT, -- Optional, if notification involves another user
    IsRead BIT NOT NULL DEFAULT 0,
    ReadAt DATETIME2,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ExpiresAt DATETIME2, -- Optional expiration
    FOREIGN KEY (UserId) REFERENCES dbo.AppUsers(Id),
    FOREIGN KEY (RelatedUserId) REFERENCES dbo.AppUsers(Id)
);

-- User application settings (non-privacy settings)
CREATE TABLE dbo.UserSettings (
    UserId INT PRIMARY KEY,
    Theme NVARCHAR(20) NOT NULL DEFAULT 'system', -- 'light', 'dark', 'system'
    Language NVARCHAR(10) NOT NULL DEFAULT 'en',
    EmailNotifications BIT NOT NULL DEFAULT 1,
    PushNotifications BIT NOT NULL DEFAULT 1,
    WeeklyDigest BIT NOT NULL DEFAULT 0,
    AutoSyncEnabled BIT NOT NULL DEFAULT 1,
    SyncIntervalMinutes INT NOT NULL DEFAULT 60,
    CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (UserId) REFERENCES dbo.UserProfiles(UserId)
);

-- User milestones and badges
CREATE TABLE dbo.Milestones (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    [Name] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(500),
    IconUrl NVARCHAR(500),
    Category SMALLINT NOT NULL, -- Short int representing category type
    RequirementType SMALLINT NOT NULL, -- Short int representing requirement type
    RequirementValue INT NOT NULL,
    Points INT NOT NULL DEFAULT 0,
    IsHidden BIT NOT NULL DEFAULT 0, -- Secret milestones
    CreateDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsActive BIT NOT NULL DEFAULT 1,
    CONSTRAINT UQ_Milestones_Name UNIQUE ([Name])
);

-- User earned milestones
CREATE TABLE dbo.UserMilestones (
    UserId INT NOT NULL,
    MilestoneId INT NOT NULL,
    EarnedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    PRIMARY KEY (UserId, MilestoneId),
    FOREIGN KEY (UserId) REFERENCES dbo.UserProfiles(UserId),
    FOREIGN KEY (MilestoneId) REFERENCES dbo.Milestones(Id)
);

-- Steam Game prices table
-- No uniqueness constraint to allow price history tracking over time
-- Using DECIMAL(18,3) to support most currencies
CREATE TABLE dbo.SteamGamePrices (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    GameId INT NOT NULL,
    Price DECIMAL(18,3) NOT NULL,
    OriginalPrice DECIMAL(18,3) NOT NULL,
    CurrencyCode NVARCHAR(3) NOT NULL, -- ISO currency code for current (discounted) price
    OriginalCurrencyCode NVARCHAR(3) NOT NULL, -- ISO currency code for original price
    RecordedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id)
);

-- Steam Game reviews table
CREATE TABLE dbo.SteamGameReviews (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    GameId INT NOT NULL,
    SteamRating INT NOT NULL,
    MetacriticScore INT,
    Recommendations INT,
    RecordedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id),
    CONSTRAINT CK_SteamGameReviews_Metacritic CHECK (MetacriticScore IS NULL OR MetacriticScore BETWEEN 0 AND 100)
);

-- Indexes for better performance
CREATE INDEX idx_SteamAchievements_GameId ON dbo.SteamAchievements(GameId);
CREATE INDEX idx_SteamAchievements_IsHidden ON dbo.SteamAchievements(IsHidden);

-- Index for user achievements by time (for latest achievements queries)
-- Composite index for efficient queries filtering by user and sorting by unlock time
CREATE INDEX idx_SteamUserAchievements_UserId_UnlockedAt ON dbo.SteamUserAchievements(UserId, UnlockedAt DESC);
CREATE INDEX idx_SteamUserAchievements_AchievementId ON dbo.SteamUserAchievements(AchievementId);

CREATE INDEX idx_SteamUserGames_UserId ON dbo.SteamUserGames(UserId);
CREATE INDEX idx_SteamUserGames_GameId ON dbo.SteamUserGames(GameId);

CREATE INDEX idx_SteamProfiles_IsActive ON dbo.SteamProfiles(IsActive);
CREATE INDEX idx_SteamProfiles_UserExternalLoginId ON dbo.SteamProfiles(UserExternalLoginId);

-- Index for latest price queries
CREATE INDEX idx_SteamGamePrices_GameId_RecordedAt ON dbo.SteamGamePrices(GameId, RecordedAt DESC);

CREATE INDEX idx_SteamGameReviews_GameId ON dbo.SteamGameReviews(GameId);

-- Frontend / Application table indexes
CREATE INDEX idx_AppUsers_Email ON dbo.AppUsers(Email);
CREATE INDEX idx_AppUsers_IsActive ON dbo.AppUsers(IsActive);
CREATE INDEX idx_AppUsers_LastLoginAt ON dbo.AppUsers(LastLoginAt DESC);

CREATE INDEX idx_UserProfiles_Handle ON dbo.UserProfiles(Handle);

CREATE INDEX idx_UserExternalLogins_AppUserId ON dbo.UserExternalLogins(AppUserId);
CREATE INDEX idx_UserExternalLogins_AuthProvider_ProviderUserId ON dbo.UserExternalLogins(AuthProvider, ProviderUserId);

CREATE INDEX idx_UserSocialLinks_UserId ON dbo.UserSocialLinks(UserId);

CREATE INDEX idx_UserFollows_FollowerId ON dbo.UserFollows(FollowerId);
CREATE INDEX idx_UserFollows_FollowingId ON dbo.UserFollows(FollowingId);

CREATE INDEX idx_UserActivities_UserId_CreatedAt ON dbo.UserActivities(UserId, CreatedAt DESC);
CREATE INDEX idx_UserActivities_ActivityType ON dbo.UserActivities(ActivityType);
CREATE INDEX idx_UserActivities_IsPublic ON dbo.UserActivities(IsPublic);

CREATE INDEX idx_UserNotifications_UserId_IsRead ON dbo.UserNotifications(UserId, IsRead);
CREATE INDEX idx_UserNotifications_UserId_CreatedAt ON dbo.UserNotifications(UserId, CreatedAt DESC);

CREATE INDEX idx_Milestones_Category ON dbo.Milestones(Category);
CREATE INDEX idx_Milestones_IsActive ON dbo.Milestones(IsActive);
