-- STEP 2: Rename columns to PascalCase
-- This step renames all columns from snake_case to PascalCase
-- Run this after Step 1 (table renaming) is complete

BEGIN TRANSACTION;

BEGIN TRY
    SELECT 'Step 2: Renaming columns to PascalCase...' AS [Migration Status];
    
    -- SteamGames table
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'steam_appid' AND name != 'SteamAppId')
        EXEC sp_rename 'SteamGames.steam_appid', 'SteamAppId', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'name' AND name != 'Name')
        EXEC sp_rename 'SteamGames.name', 'Name', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'release_date' AND name != 'ReleaseDate')
        EXEC sp_rename 'SteamGames.release_date', 'ReleaseDate', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'header_image_url' AND name != 'HeaderImageUrl')
        EXEC sp_rename 'SteamGames.header_image_url', 'HeaderImageUrl', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'short_description' AND name != 'ShortDescription')
        EXEC sp_rename 'SteamGames.short_description', 'ShortDescription', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'is_unlisted' AND name != 'IsUnlisted')
        EXEC sp_rename 'SteamGames.is_unlisted', 'IsUnlisted', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'is_removed' AND name != 'IsRemoved')
        EXEC sp_rename 'SteamGames.is_removed', 'IsRemoved', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'main_story_hours' AND name != 'MainStoryHours')
        EXEC sp_rename 'SteamGames.main_story_hours', 'MainStoryHours', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'main_sides_hours' AND name != 'MainSidesHours')
        EXEC sp_rename 'SteamGames.main_sides_hours', 'MainSidesHours', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'completionist_hours' AND name != 'CompletionistHours')
        EXEC sp_rename 'SteamGames.completionist_hours', 'CompletionistHours', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'all_styles_hours' AND name != 'AllStylesHours')
        EXEC sp_rename 'SteamGames.all_styles_hours', 'AllStylesHours', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'alias' AND name != 'Alias')
        EXEC sp_rename 'SteamGames.alias', 'Alias', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'score_rank' AND name != 'ScoreRank')
        EXEC sp_rename 'SteamGames.score_rank', 'ScoreRank', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'min_owners' AND name != 'MinOwners')
        EXEC sp_rename 'SteamGames.min_owners', 'MinOwners', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'max_owners' AND name != 'MaxOwners')
        EXEC sp_rename 'SteamGames.max_owners', 'MaxOwners', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'peak_ccu' AND name != 'PeakCcu')
        EXEC sp_rename 'SteamGames.peak_ccu', 'PeakCcu', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'created_at' AND name != 'CreateDate')
        EXEC sp_rename 'SteamGames.created_at', 'CreateDate', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'updated_at' AND name != 'UpdateDate')
        EXEC sp_rename 'SteamGames.updated_at', 'UpdateDate', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'is_active' AND name != 'IsActive')
        EXEC sp_rename 'SteamGames.is_active', 'IsActive', 'COLUMN';
    
    -- SteamAchievements table
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievements') AND name = 'game_id' AND name != 'GameId')
        EXEC sp_rename 'SteamAchievements.game_id', 'GameId', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievements') AND name = 'steam_apiname' AND name != 'SteamApiName')
        EXEC sp_rename 'SteamAchievements.steam_apiname', 'SteamApiName', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievements') AND name = 'name' AND name != 'Name')
        EXEC sp_rename 'SteamAchievements.name', 'Name', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievements') AND name = 'description' AND name != 'Description')
        EXEC sp_rename 'SteamAchievements.description', 'Description', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievements') AND name = 'icon_url' AND name != 'IconUrl')
        EXEC sp_rename 'SteamAchievements.icon_url', 'IconUrl', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievements') AND name = 'points' AND name != 'Points')
        EXEC sp_rename 'SteamAchievements.points', 'Points', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievements') AND name = 'is_hidden' AND name != 'IsHidden')
        EXEC sp_rename 'SteamAchievements.is_hidden', 'IsHidden', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievements') AND name = 'description_source' AND name != 'DescriptionSource')
        EXEC sp_rename 'SteamAchievements.description_source', 'DescriptionSource', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievements') AND name = 'last_updated' AND name != 'LastUpdated')
        EXEC sp_rename 'SteamAchievements.last_updated', 'LastUpdated', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievements') AND name = 'created_at' AND name != 'CreateDate')
        EXEC sp_rename 'SteamAchievements.created_at', 'CreateDate', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievements') AND name = 'updated_at' AND name != 'UpdateDate')
        EXEC sp_rename 'SteamAchievements.updated_at', 'UpdateDate', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievements') AND name = 'is_active' AND name != 'IsActive')
        EXEC sp_rename 'SteamAchievements.is_active', 'IsActive', 'COLUMN';
    
    -- SteamUsers table
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUsers') AND name = 'steam_id' AND name != 'SteamId')
        EXEC sp_rename 'SteamUsers.steam_id', 'SteamId', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUsers') AND name = 'username' AND name != 'Username')
        EXEC sp_rename 'SteamUsers.username', 'Username', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUsers') AND name = 'profile_url' AND name != 'ProfileUrl')
        EXEC sp_rename 'SteamUsers.profile_url', 'ProfileUrl', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUsers') AND name = 'avatar_url' AND name != 'AvatarUrl')
        EXEC sp_rename 'SteamUsers.avatar_url', 'AvatarUrl', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUsers') AND name = 'created_at' AND name != 'CreateDate')
        EXEC sp_rename 'SteamUsers.created_at', 'CreateDate', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUsers') AND name = 'updated_at' AND name != 'UpdateDate')
        EXEC sp_rename 'SteamUsers.updated_at', 'UpdateDate', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUsers') AND name = 'is_active' AND name != 'IsActive')
        EXEC sp_rename 'SteamUsers.is_active', 'IsActive', 'COLUMN';
    
    -- SteamUserAchievements table
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUserAchievements') AND name = 'user_id' AND name != 'UserId')
        EXEC sp_rename 'SteamUserAchievements.user_id', 'UserId', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUserAchievements') AND name = 'achievement_id' AND name != 'AchievementId')
        EXEC sp_rename 'SteamUserAchievements.achievement_id', 'AchievementId', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUserAchievements') AND name = 'unlocked_at' AND name != 'UnlockedAt')
        EXEC sp_rename 'SteamUserAchievements.unlocked_at', 'UnlockedAt', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUserAchievements') AND name = 'created_at' AND name != 'CreateDate')
        EXEC sp_rename 'SteamUserAchievements.created_at', 'CreateDate', 'COLUMN';
    
    -- SteamUserGames table
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUserGames') AND name = 'user_id' AND name != 'UserId')
        EXEC sp_rename 'SteamUserGames.user_id', 'UserId', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUserGames') AND name = 'game_id' AND name != 'GameId')
        EXEC sp_rename 'SteamUserGames.game_id', 'GameId', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUserGames') AND name = 'playtime_forever' AND name != 'PlaytimeForever')
        EXEC sp_rename 'SteamUserGames.playtime_forever', 'PlaytimeForever', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUserGames') AND name = 'playtime_2weeks' AND name != 'Playtime2Weeks')
        EXEC sp_rename 'SteamUserGames.playtime_2weeks', 'Playtime2Weeks', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUserGames') AND name = 'last_played_at' AND name != 'LastPlayedAt')
        EXEC sp_rename 'SteamUserGames.last_played_at', 'LastPlayedAt', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUserGames') AND name = 'created_at' AND name != 'CreateDate')
        EXEC sp_rename 'SteamUserGames.created_at', 'CreateDate', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamUserGames') AND name = 'updated_at' AND name != 'UpdateDate')
        EXEC sp_rename 'SteamUserGames.updated_at', 'UpdateDate', 'COLUMN';
    
    -- Junction tables - common columns
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGamePlatforms') AND name = 'game_id' AND name != 'GameId')
        EXEC sp_rename 'SteamGamePlatforms.game_id', 'GameId', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGamePlatforms') AND name = 'platform_id' AND name != 'PlatformId')
        EXEC sp_rename 'SteamGamePlatforms.platform_id', 'PlatformId', 'COLUMN';
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGameGenres') AND name = 'game_id' AND name != 'GameId')
        EXEC sp_rename 'SteamGameGenres.game_id', 'GameId', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGameGenres') AND name = 'genre_id' AND name != 'GenreId')
        EXEC sp_rename 'SteamGameGenres.genre_id', 'GenreId', 'COLUMN';
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGameCategories') AND name = 'game_id' AND name != 'GameId')
        EXEC sp_rename 'SteamGameCategories.game_id', 'GameId', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGameCategories') AND name = 'category_id' AND name != 'CategoryId')
        EXEC sp_rename 'SteamGameCategories.category_id', 'CategoryId', 'COLUMN';
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGameTags') AND name = 'game_id' AND name != 'GameId')
        EXEC sp_rename 'SteamGameTags.game_id', 'GameId', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGameTags') AND name = 'tag_id' AND name != 'TagId')
        EXEC sp_rename 'SteamGameTags.tag_id', 'TagId', 'COLUMN';
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGameLanguages') AND name = 'game_id' AND name != 'GameId')
        EXEC sp_rename 'SteamGameLanguages.game_id', 'GameId', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGameLanguages') AND name = 'language_id' AND name != 'LanguageId')
        EXEC sp_rename 'SteamGameLanguages.language_id', 'LanguageId', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGameLanguages') AND name = 'has_interface' AND name != 'HasInterface')
        EXEC sp_rename 'SteamGameLanguages.has_interface', 'HasInterface', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGameLanguages') AND name = 'has_full_audio' AND name != 'HasFullAudio')
        EXEC sp_rename 'SteamGameLanguages.has_full_audio', 'HasFullAudio', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGameLanguages') AND name = 'has_subtitles' AND name != 'HasSubtitles')
        EXEC sp_rename 'SteamGameLanguages.has_subtitles', 'HasSubtitles', 'COLUMN';
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGameDevelopers') AND name = 'game_id' AND name != 'GameId')
        EXEC sp_rename 'SteamGameDevelopers.game_id', 'GameId', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGameDevelopers') AND name = 'developer_id' AND name != 'DeveloperId')
        EXEC sp_rename 'SteamGameDevelopers.developer_id', 'DeveloperId', 'COLUMN';
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGamePublishers') AND name = 'game_id' AND name != 'GameId')
        EXEC sp_rename 'SteamGamePublishers.game_id', 'GameId', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGamePublishers') AND name = 'publisher_id' AND name != 'PublisherId')
        EXEC sp_rename 'SteamGamePublishers.publisher_id', 'PublisherId', 'COLUMN';
    
    -- Lookup tables
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGenres') AND name = 'name' AND name != 'Name')
        EXEC sp_rename 'SteamGenres.name', 'Name', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGenres') AND name = 'is_active' AND name != 'IsActive')
        EXEC sp_rename 'SteamGenres.is_active', 'IsActive', 'COLUMN';
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamCategories') AND name = 'name' AND name != 'Name')
        EXEC sp_rename 'SteamCategories.name', 'Name', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamCategories') AND name = 'is_active' AND name != 'IsActive')
        EXEC sp_rename 'SteamCategories.is_active', 'IsActive', 'COLUMN';
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamTags') AND name = 'name' AND name != 'Name')
        EXEC sp_rename 'SteamTags.name', 'Name', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamTags') AND name = 'is_active' AND name != 'IsActive')
        EXEC sp_rename 'SteamTags.is_active', 'IsActive', 'COLUMN';
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamLanguages') AND name = 'code' AND name != 'Code')
        EXEC sp_rename 'SteamLanguages.code', 'Code', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamLanguages') AND name = 'name' AND name != 'Name')
        EXEC sp_rename 'SteamLanguages.name', 'Name', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamLanguages') AND name = 'is_active' AND name != 'IsActive')
        EXEC sp_rename 'SteamLanguages.is_active', 'IsActive', 'COLUMN';
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamDevelopers') AND name = 'name' AND name != 'Name')
        EXEC sp_rename 'SteamDevelopers.name', 'Name', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamDevelopers') AND name = 'is_active' AND name != 'IsActive')
        EXEC sp_rename 'SteamDevelopers.is_active', 'IsActive', 'COLUMN';
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamPublishers') AND name = 'name' AND name != 'Name')
        EXEC sp_rename 'SteamPublishers.name', 'Name', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamPublishers') AND name = 'is_active' AND name != 'IsActive')
        EXEC sp_rename 'SteamPublishers.is_active', 'IsActive', 'COLUMN';
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamPlatforms') AND name = 'name' AND name != 'Name')
        EXEC sp_rename 'SteamPlatforms.name', 'Name', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamPlatforms') AND name = 'is_active' AND name != 'IsActive')
        EXEC sp_rename 'SteamPlatforms.is_active', 'IsActive', 'COLUMN';
    
    -- Other tables
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGamePrices') AND name = 'game_id' AND name != 'GameId')
        EXEC sp_rename 'SteamGamePrices.game_id', 'GameId', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGamePrices') AND name = 'price' AND name != 'Price')
        EXEC sp_rename 'SteamGamePrices.price', 'Price', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGamePrices') AND name = 'original_price' AND name != 'OriginalPrice')
        EXEC sp_rename 'SteamGamePrices.original_price', 'OriginalPrice', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGamePrices') AND name = 'discount_percent' AND name != 'DiscountPercent')
        EXEC sp_rename 'SteamGamePrices.discount_percent', 'DiscountPercent', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGamePrices') AND name = 'currency' AND name != 'CurrencyCode')
        EXEC sp_rename 'SteamGamePrices.currency', 'CurrencyCode', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGamePrices') AND name = 'currency_code' AND name != 'CurrencyCode')
        EXEC sp_rename 'SteamGamePrices.currency_code', 'CurrencyCode', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGamePrices') AND name = 'recorded_at' AND name != 'RecordedAt')
        EXEC sp_rename 'SteamGamePrices.recorded_at', 'RecordedAt', 'COLUMN';
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGameReviews') AND name = 'game_id' AND name != 'GameId')
        EXEC sp_rename 'SteamGameReviews.game_id', 'GameId', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGameReviews') AND name = 'steam_rating' AND name != 'SteamRating')
        EXEC sp_rename 'SteamGameReviews.steam_rating', 'SteamRating', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGameReviews') AND name = 'metacritic_score' AND name != 'MetacriticScore')
        EXEC sp_rename 'SteamGameReviews.metacritic_score', 'MetacriticScore', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGameReviews') AND name = 'recommendations' AND name != 'Recommendations')
        EXEC sp_rename 'SteamGameReviews.recommendations', 'Recommendations', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGameReviews') AND name = 'recorded_at' AND name != 'RecordedAt')
        EXEC sp_rename 'SteamGameReviews.recorded_at', 'RecordedAt', 'COLUMN';
    
    -- Handle both old and new table names for backward compatibility
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGamePlaytimeStats')
    BEGIN
        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGamePlaytimeStats') AND name = 'game_id' AND name != 'GameId')
            EXEC sp_rename 'SteamGamePlaytimeStats.game_id', 'GameId', 'COLUMN';
        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGamePlaytimeStats') AND name = 'average_forever' AND name != 'AverageForever')
            EXEC sp_rename 'SteamGamePlaytimeStats.average_forever', 'AverageForever', 'COLUMN';
        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGamePlaytimeStats') AND name = 'average_2weeks' AND name != 'Average2Weeks')
            EXEC sp_rename 'SteamGamePlaytimeStats.average_2weeks', 'Average2Weeks', 'COLUMN';
        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGamePlaytimeStats') AND name = 'median_forever' AND name != 'MedianForever')
            EXEC sp_rename 'SteamGamePlaytimeStats.median_forever', 'MedianForever', 'COLUMN';
        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGamePlaytimeStats') AND name = 'median_2weeks' AND name != 'Median2Weeks')
            EXEC sp_rename 'SteamGamePlaytimeStats.median_2weeks', 'Median2Weeks', 'COLUMN';
        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGamePlaytimeStats') AND name = 'updated_at' AND name != 'UpdateDate')
            EXEC sp_rename 'SteamGamePlaytimeStats.updated_at', 'UpdateDate', 'COLUMN';
    END
    -- Also handle old table name for backward compatibility
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamPlayerPlaytime')
    BEGIN
        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamPlayerPlaytime') AND name = 'game_id' AND name != 'GameId')
            EXEC sp_rename 'SteamPlayerPlaytime.game_id', 'GameId', 'COLUMN';
        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamPlayerPlaytime') AND name = 'average_forever' AND name != 'AverageForever')
            EXEC sp_rename 'SteamPlayerPlaytime.average_forever', 'AverageForever', 'COLUMN';
        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamPlayerPlaytime') AND name = 'average_2weeks' AND name != 'Average2Weeks')
            EXEC sp_rename 'SteamPlayerPlaytime.average_2weeks', 'Average2Weeks', 'COLUMN';
        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamPlayerPlaytime') AND name = 'median_forever' AND name != 'MedianForever')
            EXEC sp_rename 'SteamPlayerPlaytime.median_forever', 'MedianForever', 'COLUMN';
        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamPlayerPlaytime') AND name = 'median_2weeks' AND name != 'Median2Weeks')
            EXEC sp_rename 'SteamPlayerPlaytime.median_2weeks', 'Median2Weeks', 'COLUMN';
        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamPlayerPlaytime') AND name = 'updated_at' AND name != 'UpdateDate')
            EXEC sp_rename 'SteamPlayerPlaytime.updated_at', 'UpdateDate', 'COLUMN';
    END
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievementStats') AND name = 'achievement_id' AND name != 'AchievementId')
        EXEC sp_rename 'SteamAchievementStats.achievement_id', 'AchievementId', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievementStats') AND name = 'global_percentage' AND name != 'GlobalPercentage')
        EXEC sp_rename 'SteamAchievementStats.global_percentage', 'GlobalPercentage', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievementStats') AND name = 'updated_at' AND name != 'UpdateDate')
        EXEC sp_rename 'SteamAchievementStats.updated_at', 'UpdateDate', 'COLUMN';
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamCheckedGames') AND name = 'game_id' AND name != 'GameId')
        EXEC sp_rename 'SteamCheckedGames.game_id', 'GameId', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamCheckedGames') AND name = 'checked_at' AND name != 'CheckedAt')
        EXEC sp_rename 'SteamCheckedGames.checked_at', 'CheckedAt', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamCheckedGames') AND name = 'has_data' AND name != 'HasData')
        EXEC sp_rename 'SteamCheckedGames.has_data', 'HasData', 'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamCheckedGames') AND name = 'source' AND name != 'Source')
        EXEC sp_rename 'SteamCheckedGames.source', 'Source', 'COLUMN';
    
    SELECT 'Step 2 complete: All columns renamed to PascalCase.' AS [Migration Status];
    
    COMMIT TRANSACTION;
    SELECT 'Transaction committed successfully.' AS [Migration Status];
    
END TRY
BEGIN CATCH
    DECLARE @errorMsg NVARCHAR(MAX) = ERROR_MESSAGE();
    SELECT 'Error occurred during Step 2:' AS [Migration Error];
    SELECT @errorMsg AS [Error Message];
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;

