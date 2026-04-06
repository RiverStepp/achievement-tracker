-- Fix data that violates CHECK constraints
-- This script is for documentation/troubleshooting only.
-- It is not part of the main numbered migration steps.
--
-- It normalizes:
-- - SteamGamePrices.DiscountPercent   into [0, 100]
-- - SteamGameReviews.MetacriticScore  into [0, 100]
-- - SteamAchievementStats.GlobalPercentage into [0, 100]

BEGIN TRANSACTION;

BEGIN TRY
    SELECT 'Fixing data that violates CHECK constraints...' AS [Migration Status];

    ----------------------------------------------------------------------
    -- SteamGamePrices: clamp DiscountPercent into [0, 100]
    ----------------------------------------------------------------------
    IF OBJECT_ID('dbo.SteamGamePrices', 'U') IS NOT NULL
    BEGIN
        UPDATE dbo.SteamGamePrices
        SET DiscountPercent =
            CASE
                WHEN DiscountPercent IS NULL THEN 0
                WHEN DiscountPercent < 0 THEN 0
                WHEN DiscountPercent > 100 THEN 100
                ELSE DiscountPercent
            END
        WHERE DiscountPercent IS NULL
           OR DiscountPercent < 0
           OR DiscountPercent > 100;

        SELECT 'Normalized SteamGamePrices.DiscountPercent into [0, 100].' AS [Migration Status];
    END

    ----------------------------------------------------------------------
    -- SteamGameReviews: clamp MetacriticScore into [0, 100]
    ----------------------------------------------------------------------
    IF OBJECT_ID('dbo.SteamGameReviews', 'U') IS NOT NULL
    BEGIN
        UPDATE dbo.SteamGameReviews
        SET MetacriticScore =
            CASE
                WHEN MetacriticScore IS NULL THEN 0
                WHEN MetacriticScore < 0 THEN 0
                WHEN MetacriticScore > 100 THEN 100
                ELSE MetacriticScore
            END
        WHERE MetacriticScore IS NULL
           OR MetacriticScore < 0
           OR MetacriticScore > 100;

        SELECT 'Normalized SteamGameReviews.MetacriticScore into [0, 100].' AS [Migration Status];
    END

    ----------------------------------------------------------------------
    -- SteamAchievementStats: clamp GlobalPercentage into [0, 100]
    ----------------------------------------------------------------------
    IF OBJECT_ID('dbo.SteamAchievementStats', 'U') IS NOT NULL
    BEGIN
        UPDATE dbo.SteamAchievementStats
        SET GlobalPercentage =
            CASE
                WHEN GlobalPercentage IS NULL THEN 0
                WHEN GlobalPercentage < 0 THEN 0
                WHEN GlobalPercentage > 100 THEN 100
                ELSE GlobalPercentage
            END
        WHERE GlobalPercentage IS NULL
           OR GlobalPercentage < 0
           OR GlobalPercentage > 100;

        SELECT 'Normalized SteamAchievementStats.GlobalPercentage into [0, 100].' AS [Migration Status];
    END

    COMMIT TRANSACTION;
    SELECT 'Complete: Data normalized for CHECK constraints.' AS [Migration Status];

END TRY
BEGIN CATCH
    DECLARE @errorMsg NVARCHAR(MAX) = ERROR_MESSAGE();
    SELECT 'Error occurred in fix-check-violations:' AS [Migration Error];
    SELECT @errorMsg AS [Error Message];

    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
END CATCH;

