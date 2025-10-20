-- Steam Achievement Tracker Database Schema
-- Run this on your PostgreSQL database to create the database structure

-- Games table
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    steam_appid INTEGER UNIQUE,
    name VARCHAR(255),
    release_date DATE,
    developer VARCHAR(255),
    publisher VARCHAR(255),
    genres JSONB, -- JSON data type in PostgreSQL
    header_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Achievements table
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(id),
    steam_apiname VARCHAR(255),
    name VARCHAR(255),
    description TEXT,
    icon_url VARCHAR(500),
    points INTEGER,
    is_hidden BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    steam_id BIGINT UNIQUE,
    username VARCHAR(255),
    profile_url VARCHAR(500),
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User achievements junction table
CREATE TABLE user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    achievement_id INTEGER REFERENCES achievements(id),
    unlocked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id) -- Prevent duplicate entries
);

-- Global achievement statistics
CREATE TABLE achievement_stats (
    achievement_id INTEGER REFERENCES achievements(id),
    global_percentage DECIMAL(5,2),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_games_steam_appid ON games(steam_appid);
CREATE INDEX idx_achievements_game_id ON achievements(game_id);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX idx_users_steam_id ON users(steam_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();