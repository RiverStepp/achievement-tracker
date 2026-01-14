-- Steam Achievement Tracker Database Schema
-- MSSQL Server Schema
-- Refactored to remove JSON columns and use proper relational tables

-- Platform lookup table (limited set of values)
CREATE TABLE platforms (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) UNIQUE NOT NULL
);

-- Genre lookup table
CREATE TABLE genres (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) UNIQUE NOT NULL
);

-- Category lookup table
CREATE TABLE categories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) UNIQUE NOT NULL
);

-- Tag lookup table
CREATE TABLE tags (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) UNIQUE NOT NULL
);

-- Language lookup table
CREATE TABLE languages (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(10) UNIQUE NOT NULL, -- ISO language code (e.g., 'en', 'fr', 'de')
    name NVARCHAR(100) NOT NULL -- Full language name (e.g., 'English', 'French', 'German')
);

-- Developer lookup table
CREATE TABLE developers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) UNIQUE NOT NULL
);

-- Publisher lookup table
CREATE TABLE publishers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) UNIQUE NOT NULL
);

-- Games table (refactored - removed JSON columns and date_of_removal)
CREATE TABLE games (
    id INT IDENTITY(1,1) PRIMARY KEY,
    steam_appid INT,
    name NVARCHAR(255),
    release_date DATE,
    header_image_url NVARCHAR(500),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    price NVARCHAR(50),
    original_price NVARCHAR(50),
    discount_percent INT,
    currency NVARCHAR(10),
    short_description NVARCHAR(MAX),
    metacritic_score INT,
    recommendations INT,
    is_unlisted BIT DEFAULT 0,
    is_removed BIT DEFAULT 0,
    main_story_hours DECIMAL(10,2),
    main_sides_hours DECIMAL(10,2),
    completionist_hours DECIMAL(10,2),
    all_styles_hours DECIMAL(10,2),
    alias NVARCHAR(255),
    score_rank INT,
    min_owners INT, -- Minimum owner count
    max_owners INT, -- Maximum owner count (NULL if exact number, otherwise represents range)
    peak_ccu INT
);

-- Junction tables for many-to-many relationships
CREATE TABLE game_platforms (
    id INT IDENTITY(1,1) PRIMARY KEY,
    game_id INT NOT NULL,
    platform_id INT NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE,
    UNIQUE(game_id, platform_id)
);

CREATE TABLE game_genres (
    id INT IDENTITY(1,1) PRIMARY KEY,
    game_id INT NOT NULL,
    genre_id INT NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE,
    UNIQUE(game_id, genre_id)
);

CREATE TABLE game_categories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    game_id INT NOT NULL,
    category_id INT NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(game_id, category_id)
);

CREATE TABLE game_tags (
    id INT IDENTITY(1,1) PRIMARY KEY,
    game_id INT NOT NULL,
    tag_id INT NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(game_id, tag_id)
);

CREATE TABLE game_languages (
    id INT IDENTITY(1,1) PRIMARY KEY,
    game_id INT NOT NULL,
    language_id INT NOT NULL,
    has_interface BIT DEFAULT 0, -- Interface supported
    has_full_audio BIT DEFAULT 0, -- Full audio supported
    has_subtitles BIT DEFAULT 0, -- Subtitles supported
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE,
    UNIQUE(game_id, language_id, has_interface, has_full_audio, has_subtitles)
);

CREATE TABLE game_developers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    game_id INT NOT NULL,
    developer_id INT NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE CASCADE,
    UNIQUE(game_id, developer_id)
);

CREATE TABLE game_publishers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    game_id INT NOT NULL,
    publisher_id INT NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (publisher_id) REFERENCES publishers(id) ON DELETE CASCADE,
    UNIQUE(game_id, publisher_id)
);

-- Achievements table
CREATE TABLE achievements (
    id INT IDENTITY(1,1) PRIMARY KEY,
    game_id INT,
    steam_apiname NVARCHAR(255),
    name NVARCHAR(255),
    description NVARCHAR(MAX),
    icon_url NVARCHAR(500),
    points INT,
    is_hidden BIT,
    created_at DATETIME2 DEFAULT GETDATE(),
    description_source NVARCHAR(50),
    last_updated DATETIME2,
    FOREIGN KEY (game_id) REFERENCES games(id)
);

-- Users table
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    steam_id BIGINT,
    username NVARCHAR(255),
    profile_url NVARCHAR(500),
    avatar_url NVARCHAR(500),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- User achievements junction table
CREATE TABLE user_achievements (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    achievement_id INT,
    unlocked_at DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (achievement_id) REFERENCES achievements(id),
    UNIQUE(user_id, achievement_id)
);

-- Global achievement statistics
CREATE TABLE achievement_stats (
    achievement_id INT,
    global_percentage DECIMAL(5,2),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (achievement_id) REFERENCES achievements(id)
);

-- Checked games tracking table
CREATE TABLE checked_games (
    id INT IDENTITY(1,1) PRIMARY KEY,
    game_id INT,
    steam_appid INT,
    checked_at DATETIME2 DEFAULT GETDATE(),
    has_data BIT DEFAULT 0,
    source NVARCHAR(50),
    FOREIGN KEY (game_id) REFERENCES games(id)
);

-- Game prices table
CREATE TABLE game_prices (
    id INT IDENTITY(1,1) PRIMARY KEY,
    game_id INT,
    price NVARCHAR(50),
    original_price NVARCHAR(50),
    discount_percent INT,
    currency NVARCHAR(10),
    recorded_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (game_id) REFERENCES games(id)
);

-- Game reviews table
CREATE TABLE game_reviews (
    id INT IDENTITY(1,1) PRIMARY KEY,
    game_id INT,
    steam_rating INT,
    metacritic_score INT,
    recommendations INT,
    recorded_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (game_id) REFERENCES games(id)
);

-- Player playtime table
CREATE TABLE player_playtime (
    id INT IDENTITY(1,1) PRIMARY KEY,
    game_id INT NOT NULL,
    average_forever INT,
    average_2weeks INT,
    median_forever INT,
    median_2weeks INT,
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (game_id) REFERENCES games(id),
    UNIQUE(game_id)
);

-- Indexes for better performance
CREATE INDEX idx_games_steam_appid ON games(steam_appid);
CREATE UNIQUE INDEX UQ_games_steam_appid ON games(steam_appid);

CREATE INDEX idx_achievements_game_id ON achievements(game_id);
CREATE INDEX idx_achievements_is_hidden ON achievements(is_hidden);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);

CREATE INDEX idx_users_steam_id ON users(steam_id);
CREATE UNIQUE INDEX UQ_users_steam_id ON users(steam_id);

CREATE INDEX idx_checked_games_game_id ON checked_games(game_id);
CREATE INDEX idx_checked_games_steam_appid ON checked_games(steam_appid);

CREATE INDEX idx_game_prices_game_id ON game_prices(game_id);
CREATE INDEX idx_game_reviews_game_id ON game_reviews(game_id);
CREATE INDEX idx_player_playtime_game_id ON player_playtime(game_id);

-- Junction table indexes
CREATE INDEX idx_game_platforms_game_id ON game_platforms(game_id);
CREATE INDEX idx_game_platforms_platform_id ON game_platforms(platform_id);

CREATE INDEX idx_game_genres_game_id ON game_genres(game_id);
CREATE INDEX idx_game_genres_genre_id ON game_genres(genre_id);

CREATE INDEX idx_game_categories_game_id ON game_categories(game_id);
CREATE INDEX idx_game_categories_category_id ON game_categories(category_id);

CREATE INDEX idx_game_tags_game_id ON game_tags(game_id);
CREATE INDEX idx_game_tags_tag_id ON game_tags(tag_id);

CREATE INDEX idx_game_languages_game_id ON game_languages(game_id);
CREATE INDEX idx_game_languages_language_id ON game_languages(language_id);

CREATE INDEX idx_game_developers_game_id ON game_developers(game_id);
CREATE INDEX idx_game_developers_developer_id ON game_developers(developer_id);

CREATE INDEX idx_game_publishers_game_id ON game_publishers(game_id);
CREATE INDEX idx_game_publishers_publisher_id ON game_publishers(publisher_id);

-- Lookup table indexes
CREATE INDEX idx_platforms_name ON platforms(name);
CREATE INDEX idx_genres_name ON genres(name);
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_languages_code ON languages(code);
CREATE INDEX idx_developers_name ON developers(name);
CREATE INDEX idx_publishers_name ON publishers(name);

GO

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER trg_games_updated_at
ON games
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE games
    SET updated_at = GETDATE()
    FROM games g
    INNER JOIN inserted i ON g.id = i.id;
END;
GO
