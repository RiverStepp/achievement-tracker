-- STEP 1: Rename tables to PascalCase
-- This step only renames tables from snake_case or lowercase to PascalCase
-- Run this step first to get all table names standardized

BEGIN TRANSACTION;

BEGIN TRY
    SELECT 'Step 1: Renaming tables to PascalCase...' AS [Migration Status];
    
    -- Games table
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'games' AND name != 'SteamGames')
        EXEC sp_rename 'games', 'SteamGames';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_games' AND name != 'SteamGames')
        EXEC sp_rename 'steam_games', 'SteamGames';
    
    -- Achievements table
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'achievements' AND name != 'SteamAchievements')
        EXEC sp_rename 'achievements', 'SteamAchievements';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_achievements' AND name != 'SteamAchievements')
        EXEC sp_rename 'steam_achievements', 'SteamAchievements';
    
    -- Users table
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'users' AND name != 'SteamUsers')
        EXEC sp_rename 'users', 'SteamUsers';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_users' AND name != 'SteamUsers')
        EXEC sp_rename 'steam_users', 'SteamUsers';
    
    -- User achievements table
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'user_achievements' AND name != 'SteamUserAchievements')
        EXEC sp_rename 'user_achievements', 'SteamUserAchievements';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_user_achievements' AND name != 'SteamUserAchievements')
        EXEC sp_rename 'steam_user_achievements', 'SteamUserAchievements';
    
    -- User games table
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'user_games' AND name != 'SteamUserGames')
        EXEC sp_rename 'user_games', 'SteamUserGames';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_user_games' AND name != 'SteamUserGames')
        EXEC sp_rename 'steam_user_games', 'SteamUserGames';
    
    -- Genres table
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'genres' AND name != 'SteamGenres')
        EXEC sp_rename 'genres', 'SteamGenres';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_genres' AND name != 'SteamGenres')
        EXEC sp_rename 'steam_genres', 'SteamGenres';
    
    -- Categories table
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'categories' AND name != 'SteamCategories')
        EXEC sp_rename 'categories', 'SteamCategories';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_categories' AND name != 'SteamCategories')
        EXEC sp_rename 'steam_categories', 'SteamCategories';
    
    -- Tags table
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'tags' AND name != 'SteamTags')
        EXEC sp_rename 'tags', 'SteamTags';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_tags' AND name != 'SteamTags')
        EXEC sp_rename 'steam_tags', 'SteamTags';
    
    -- Languages table
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'languages' AND name != 'SteamLanguages')
        EXEC sp_rename 'languages', 'SteamLanguages';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_languages' AND name != 'SteamLanguages')
        EXEC sp_rename 'steam_languages', 'SteamLanguages';
    
    -- Developers table
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'developers' AND name != 'SteamDevelopers')
        EXEC sp_rename 'developers', 'SteamDevelopers';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_developers' AND name != 'SteamDevelopers')
        EXEC sp_rename 'steam_developers', 'SteamDevelopers';
    
    -- Publishers table
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'publishers' AND name != 'SteamPublishers')
        EXEC sp_rename 'publishers', 'SteamPublishers';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_publishers' AND name != 'SteamPublishers')
        EXEC sp_rename 'steam_publishers', 'SteamPublishers';
    
    -- Platforms table
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'platforms' AND name != 'SteamPlatforms')
        EXEC sp_rename 'platforms', 'SteamPlatforms';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_platforms' AND name != 'SteamPlatforms')
        EXEC sp_rename 'steam_platforms', 'SteamPlatforms';
    
    -- Junction tables
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'game_platforms' AND name != 'SteamGamePlatforms')
        EXEC sp_rename 'game_platforms', 'SteamGamePlatforms';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_game_platforms' AND name != 'SteamGamePlatforms')
        EXEC sp_rename 'steam_game_platforms', 'SteamGamePlatforms';
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'game_genres' AND name != 'SteamGameGenres')
        EXEC sp_rename 'game_genres', 'SteamGameGenres';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_game_genres' AND name != 'SteamGameGenres')
        EXEC sp_rename 'steam_game_genres', 'SteamGameGenres';
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'game_categories' AND name != 'SteamGameCategories')
        EXEC sp_rename 'game_categories', 'SteamGameCategories';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_game_categories' AND name != 'SteamGameCategories')
        EXEC sp_rename 'steam_game_categories', 'SteamGameCategories';
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'game_tags' AND name != 'SteamGameTags')
        EXEC sp_rename 'game_tags', 'SteamGameTags';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_game_tags' AND name != 'SteamGameTags')
        EXEC sp_rename 'steam_game_tags', 'SteamGameTags';
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'game_developers' AND name != 'SteamGameDevelopers')
        EXEC sp_rename 'game_developers', 'SteamGameDevelopers';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_game_developers' AND name != 'SteamGameDevelopers')
        EXEC sp_rename 'steam_game_developers', 'SteamGameDevelopers';
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'game_publishers' AND name != 'SteamGamePublishers')
        EXEC sp_rename 'game_publishers', 'SteamGamePublishers';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_game_publishers' AND name != 'SteamGamePublishers')
        EXEC sp_rename 'steam_game_publishers', 'SteamGamePublishers';
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'game_languages' AND name != 'SteamGameLanguages')
        EXEC sp_rename 'game_languages', 'SteamGameLanguages';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_game_languages' AND name != 'SteamGameLanguages')
        EXEC sp_rename 'steam_game_languages', 'SteamGameLanguages';
    
    -- Other tables
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'game_prices' AND name != 'SteamGamePrices')
        EXEC sp_rename 'game_prices', 'SteamGamePrices';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_game_prices' AND name != 'SteamGamePrices')
        EXEC sp_rename 'steam_game_prices', 'SteamGamePrices';
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'game_reviews' AND name != 'SteamGameReviews')
        EXEC sp_rename 'game_reviews', 'SteamGameReviews';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_game_reviews' AND name != 'SteamGameReviews')
        EXEC sp_rename 'steam_game_reviews', 'SteamGameReviews';
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'player_playtime' AND name != 'SteamGamePlaytimeStats')
        EXEC sp_rename 'player_playtime', 'SteamGamePlaytimeStats';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_player_playtime' AND name != 'SteamGamePlaytimeStats')
        EXEC sp_rename 'steam_player_playtime', 'SteamGamePlaytimeStats';
    -- Also handle if it was already renamed to SteamPlayerPlaytime in a previous migration
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamPlayerPlaytime' AND name != 'SteamGamePlaytimeStats')
        EXEC sp_rename 'SteamPlayerPlaytime', 'SteamGamePlaytimeStats';
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'achievement_stats' AND name != 'SteamAchievementStats')
        EXEC sp_rename 'achievement_stats', 'SteamAchievementStats';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_achievement_stats' AND name != 'SteamAchievementStats')
        EXEC sp_rename 'steam_achievement_stats', 'SteamAchievementStats';
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'checked_games' AND name != 'SteamCheckedGames')
        EXEC sp_rename 'checked_games', 'SteamCheckedGames';
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'steam_checked_games' AND name != 'SteamCheckedGames')
        EXEC sp_rename 'steam_checked_games', 'SteamCheckedGames';
    
    SELECT 'Step 1 complete: All tables renamed to PascalCase.' AS [Migration Status];
    
    COMMIT TRANSACTION;
    SELECT 'Transaction committed successfully.' AS [Migration Status];
    
END TRY
BEGIN CATCH
    DECLARE @errorMsg NVARCHAR(MAX) = ERROR_MESSAGE();
    SELECT 'Error occurred during Step 1:' AS [Migration Error];
    SELECT @errorMsg AS [Error Message];
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;

