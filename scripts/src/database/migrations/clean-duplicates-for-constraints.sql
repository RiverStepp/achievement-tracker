-- Clean up duplicate rows before adding UNIQUE constraints
-- This script is for documentation/troubleshooting only.
-- It is not part of the main numbered migration steps.

BEGIN TRANSACTION;

BEGIN TRY
    SELECT 'Cleaning duplicate rows for unique constraints...' AS [Migration Status];

    ----------------------------------------------------------------------
    -- SteamAchievements: (GameId, SteamApiName)
    ----------------------------------------------------------------------
    IF OBJECT_ID('dbo.SteamAchievements', 'U') IS NOT NULL
    BEGIN
        -- Use a temp table so we can reference duplicates in multiple DELETEs
        IF OBJECT_ID('tempdb..#SteamAchievementDups') IS NOT NULL
            DROP TABLE #SteamAchievementDups;

        SELECT Id,
               ROW_NUMBER() OVER (PARTITION BY GameId, SteamApiName ORDER BY Id) AS rn
        INTO #SteamAchievementDups
        FROM dbo.SteamAchievements;

        -- First, delete any dependent stats rows that point at duplicate achievements
        DELETE sas
        FROM dbo.SteamAchievementStats sas
        INNER JOIN #SteamAchievementDups d ON sas.AchievementId = d.Id
        WHERE d.rn > 1;

        -- Then delete the duplicate achievement rows themselves
        DELETE a
        FROM dbo.SteamAchievements a
        INNER JOIN #SteamAchievementDups d ON a.Id = d.Id
        WHERE d.rn > 1;

        DROP TABLE #SteamAchievementDups;

        SELECT 'Removed duplicate SteamAchievements by (GameId, SteamApiName) and their dependent stats rows.' AS [Migration Status];
    END

    ----------------------------------------------------------------------
    -- SteamUsers: SteamId
    ----------------------------------------------------------------------
    IF OBJECT_ID('dbo.SteamUsers', 'U') IS NOT NULL
    BEGIN
        ;WITH Dups AS (
            SELECT Id,
                   ROW_NUMBER() OVER (PARTITION BY SteamId ORDER BY Id) AS rn
            FROM dbo.SteamUsers
        )
        DELETE FROM Dups WHERE rn > 1;

        SELECT 'Removed duplicate SteamUsers by SteamId.' AS [Migration Status];
    END

    ----------------------------------------------------------------------
    -- SteamUserAchievements: (UserId, AchievementId)
    ----------------------------------------------------------------------
    IF OBJECT_ID('dbo.SteamUserAchievements', 'U') IS NOT NULL
    BEGIN
        ;WITH Dups AS (
            SELECT Id,
                   ROW_NUMBER() OVER (PARTITION BY UserId, AchievementId ORDER BY Id) AS rn
            FROM dbo.SteamUserAchievements
        )
        DELETE FROM Dups WHERE rn > 1;

        SELECT 'Removed duplicate SteamUserAchievements by (UserId, AchievementId).' AS [Migration Status];
    END

    ----------------------------------------------------------------------
    -- SteamUserGames: (UserId, GameId)
    ----------------------------------------------------------------------
    IF OBJECT_ID('dbo.SteamUserGames', 'U') IS NOT NULL
    BEGIN
        ;WITH Dups AS (
            SELECT Id,
                   ROW_NUMBER() OVER (PARTITION BY UserId, GameId ORDER BY Id) AS rn
            FROM dbo.SteamUserGames
        )
        DELETE FROM Dups WHERE rn > 1;

        SELECT 'Removed duplicate SteamUserGames by (UserId, GameId).' AS [Migration Status];
    END

    ----------------------------------------------------------------------
    -- SteamGamePlaytimeStats: GameId (should be one row per game)
    ----------------------------------------------------------------------
    IF OBJECT_ID('dbo.SteamGamePlaytimeStats', 'U') IS NOT NULL
    BEGIN
        ;WITH Dups AS (
            SELECT Id,
                   ROW_NUMBER() OVER (PARTITION BY GameId ORDER BY Id) AS rn
            FROM dbo.SteamGamePlaytimeStats
        )
        DELETE FROM Dups WHERE rn > 1;

        SELECT 'Removed duplicate SteamGamePlaytimeStats by GameId.' AS [Migration Status];
    END

    ----------------------------------------------------------------------
    -- SteamPlayerPlaytime (legacy table, if still present): GameId
    ----------------------------------------------------------------------
    IF OBJECT_ID('dbo.SteamPlayerPlaytime', 'U') IS NOT NULL
    BEGIN
        ;WITH Dups AS (
            SELECT Id,
                   ROW_NUMBER() OVER (PARTITION BY GameId ORDER BY Id) AS rn
            FROM dbo.SteamPlayerPlaytime
        )
        DELETE FROM Dups WHERE rn > 1;

        SELECT 'Removed duplicate SteamPlayerPlaytime by GameId.' AS [Migration Status];
    END

    COMMIT TRANSACTION;
    SELECT 'Complete: Duplicate rows cleaned.' AS [Migration Status];

END TRY
BEGIN CATCH
    DECLARE @errorMsg NVARCHAR(MAX) = ERROR_MESSAGE();
    SELECT 'Error occurred in clean-duplicates-for-constraints:' AS [Migration Error];
    SELECT @errorMsg AS [Error Message];

    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
END CATCH;

