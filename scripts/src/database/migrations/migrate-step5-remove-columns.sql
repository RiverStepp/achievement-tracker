-- STEP 5: Remove redundant columns and drop legacy SteamCheckedGames
-- Run this after Step 4 (data migration) is complete

BEGIN TRANSACTION;

BEGIN TRY
    SELECT 'Step 5: Removing redundant columns from SteamGames...' AS [Migration Status];
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'price')
        ALTER TABLE SteamGames DROP COLUMN price;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'Price')
        ALTER TABLE SteamGames DROP COLUMN Price;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'original_price')
        ALTER TABLE SteamGames DROP COLUMN original_price;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'OriginalPrice')
        ALTER TABLE SteamGames DROP COLUMN OriginalPrice;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'discount_percent')
        ALTER TABLE SteamGames DROP COLUMN discount_percent;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'DiscountPercent')
        ALTER TABLE SteamGames DROP COLUMN DiscountPercent;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'currency')
        ALTER TABLE SteamGames DROP COLUMN currency;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'Currency')
        ALTER TABLE SteamGames DROP COLUMN Currency;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'currency_code')
        ALTER TABLE SteamGames DROP COLUMN currency_code;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'CurrencyCode')
        ALTER TABLE SteamGames DROP COLUMN CurrencyCode;
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'metacritic_score')
        ALTER TABLE SteamGames DROP COLUMN metacritic_score;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'MetacriticScore')
        ALTER TABLE SteamGames DROP COLUMN MetacriticScore;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'recommendations')
        ALTER TABLE SteamGames DROP COLUMN recommendations;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'Recommendations')
        ALTER TABLE SteamGames DROP COLUMN Recommendations;
    
    -- Also drop legacy SteamCheckedGames table (no longer in schema.sql)
    IF OBJECT_ID('dbo.SteamCheckedGames', 'U') IS NOT NULL
    BEGIN
        SELECT 'Dropping legacy table SteamCheckedGames...' AS [Migration Status];
        DROP TABLE dbo.SteamCheckedGames;
    END
    
    SELECT 'Step 5 complete: Redundant columns removed and legacy tables cleaned up.' AS [Migration Status];
    
    COMMIT TRANSACTION;
    SELECT 'Transaction committed successfully.' AS [Migration Status];
    
END TRY
BEGIN CATCH
    DECLARE @errorMsg NVARCHAR(MAX) = ERROR_MESSAGE();
    SELECT 'Error occurred during Step 5:' AS [Migration Error];
    SELECT @errorMsg AS [Error Message];
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;

