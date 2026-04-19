-- Ensure OriginalCurrencyCode exists on SteamGamePrices
-- This script is for documentation/backwards-compatibility only.
-- New databases created from schema.sql already include this column.

BEGIN TRANSACTION;

BEGIN TRY
    SELECT 'Ensuring OriginalCurrencyCode column exists on SteamGamePrices...' AS [Migration Status];

    IF OBJECT_ID('dbo.SteamGamePrices', 'U') IS NULL
    BEGIN
        SELECT 'SteamGamePrices table does not exist, nothing to change.' AS [Migration Status];
        COMMIT TRANSACTION;
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID('dbo.SteamGamePrices')
          AND name = 'OriginalCurrencyCode'
    )
    BEGIN
        ALTER TABLE dbo.SteamGamePrices ADD OriginalCurrencyCode NVARCHAR(3) NULL;
        SELECT 'Added OriginalCurrencyCode NVARCHAR(3) column to SteamGamePrices.' AS [Migration Status];
    END
    ELSE
    BEGIN
        SELECT 'OriginalCurrencyCode column already exists on SteamGamePrices, nothing to add.' AS [Migration Status];
    END

    COMMIT TRANSACTION;
    SELECT 'Complete: SteamGamePrices has OriginalCurrencyCode column.' AS [Migration Status];

END TRY
BEGIN CATCH
    DECLARE @errorMsg NVARCHAR(MAX) = ERROR_MESSAGE();
    SELECT 'Error occurred in add-originalcurrencycode-column:' AS [Migration Error];
    SELECT @errorMsg AS [Error Message];
    ROLLBACK TRANSACTION;
END CATCH;

