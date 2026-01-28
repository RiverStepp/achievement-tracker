-- STEP 4: Migrate data from SteamGames to SteamGamePrices and SteamGameReviews
-- This step moves price and review data from SteamGames to the appropriate tables
-- Run this after Step 3 (adding columns) is complete

BEGIN TRANSACTION;

BEGIN TRY
    SELECT 'Step 4: Migrating data to new tables...' AS [Migration Status];
    
    -- Verify required tables exist
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGames')
    BEGIN
        SELECT 'ERROR: SteamGames table does not exist!' AS [Migration Error];
        THROW 50000, 'SteamGames table does not exist', 1;
    END
    
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGamePrices')
    BEGIN
        SELECT 'ERROR: SteamGamePrices table does not exist! Please create it first using schema.sql' AS [Migration Error];
        SELECT 'Run this SQL to create the table:' AS [Migration Help];
        SELECT 'CREATE TABLE dbo.SteamGamePrices (Id INT IDENTITY(1,1) PRIMARY KEY, GameId INT NOT NULL, Price DECIMAL(18,2), OriginalPrice DECIMAL(18,2), DiscountPercent INT, CurrencyCode NVARCHAR(3) NOT NULL, OriginalCurrencyCode NVARCHAR(3) NULL, RecordedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(), FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id));' AS [SQL];
        THROW 50000, 'SteamGamePrices table does not exist', 1;
    END
    
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGameReviews')
    BEGIN
        SELECT 'ERROR: SteamGameReviews table does not exist! Please create it first using schema.sql' AS [Migration Error];
        SELECT 'Run this SQL to create the table:' AS [Migration Help];
        SELECT 'CREATE TABLE dbo.SteamGameReviews (Id INT IDENTITY(1,1) PRIMARY KEY, GameId INT NOT NULL, SteamRating INT, MetacriticScore INT, Recommendations INT, RecordedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(), FOREIGN KEY (GameId) REFERENCES dbo.SteamGames(Id));' AS [SQL];
        THROW 50000, 'SteamGameReviews table does not exist', 1;
    END
    
    -- Migrate price data from SteamGames to SteamGamePrices
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGames')
        AND EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGamePrices')
    BEGIN
        -- Ensure SteamGamePrices columns match expected types (DECIMAL for prices)
        IF EXISTS (
            SELECT 1
            FROM sys.columns
            WHERE object_id = OBJECT_ID('dbo.SteamGamePrices')
              AND name = 'Price'
        )
        BEGIN
            ALTER TABLE dbo.SteamGamePrices ALTER COLUMN Price DECIMAL(18,2) NULL;
        END;

        IF EXISTS (
            SELECT 1
            FROM sys.columns
            WHERE object_id = OBJECT_ID('dbo.SteamGamePrices')
              AND name = 'OriginalPrice'
        )
        BEGIN
            ALTER TABLE dbo.SteamGamePrices ALTER COLUMN OriginalPrice DECIMAL(18,2) NULL;
        END;

        -- For convenience during development/testing, clear existing price records
        DELETE FROM dbo.SteamGamePrices;
        SELECT 'Cleared existing rows from SteamGamePrices before migration.' AS [Migration Status];

        SELECT 'Migrating price data from SteamGames to SteamGamePrices...' AS [Migration Status];
        
        -- Diagnostic: Check what price columns exist
        SELECT 'Checking for price columns in SteamGames...' AS [Migration Status];
        SELECT name AS [Column Name] 
        FROM sys.columns 
        WHERE object_id = OBJECT_ID('SteamGames') 
        AND name IN ('Price', 'price', 'OriginalPrice', 'original_price', 'DiscountPercent', 'discount_percent', 'Currency', 'currency', 'CurrencyCode', 'currency_code')
        ORDER BY name;
        
        -- Check which columns exist and build dynamic SQL
        DECLARE @priceSql NVARCHAR(MAX) = N'';
        DECLARE @hasAnyPriceColumn BIT = 0;
        
        -- Check for price columns
        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name IN ('Price', 'price', 'OriginalPrice', 'original_price', 'DiscountPercent', 'discount_percent', 'Currency', 'currency', 'CurrencyCode', 'currency_code'))
        BEGIN
            SET @hasAnyPriceColumn = 1;
            
            SET @priceSql = N'
            INSERT INTO dbo.SteamGamePrices (GameId, Price, OriginalPrice, DiscountPercent, CurrencyCode, OriginalCurrencyCode, RecordedAt)
            SELECT 
                g.Id AS GameId,';
            
            -- Build Price column
            -- Strip non-numeric characters (currency symbols/text, commas, spaces)
            -- keep the decimal point so values like 19.99 stay 19.99, then convert to DECIMAL(18,2)
            -- If the text indicates "free", store 0
            -- First check what price columns actually exist
            DECLARE @hasPriceCol BIT = 0;
            DECLARE @hasOriginalPriceCol BIT = 0;
            
            IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'Price')
            BEGIN
                SET @hasPriceCol = 1;
                SET @priceSql = @priceSql + N'
                CASE
                    WHEN LOWER(g.Price) LIKE ''free%'' THEN 0
                    ELSE TRY_CAST(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(
                                        REPLACE(g.Price, ''HK$'', ''''), -- remove HK$
                                        ''$'', ''''                      -- remove $
                                    ),
                                    ''USD'', ''''                       -- remove USD text if present
                                ),
                                '','', ''''                            -- remove thousands separator
                            ),
                            '' '', ''''                               -- remove spaces
                        ) AS DECIMAL(18,2)
                    )
                END AS Price,';
                SELECT 'Found Price column (PascalCase)' AS [Migration Status];
            END
            ELSE IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'price')
            BEGIN
                SET @hasPriceCol = 1;
                SET @priceSql = @priceSql + N'
                CASE
                    WHEN LOWER(g.price) LIKE ''free%'' THEN 0
                    ELSE TRY_CAST(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(
                                        REPLACE(g.price, ''HK$'', ''''),
                                        ''$'', ''''
                                    ),
                                    ''USD'', ''''
                                ),
                                '','', ''''
                            ),
                            '' '', ''''
                        ) AS DECIMAL(18,2)
                    )
                END AS Price,';
                SELECT 'Found price column (snake_case)' AS [Migration Status];
            END
            ELSE
            BEGIN
                SET @priceSql = @priceSql + N'
                NULL AS Price,';
                SELECT 'No Price column found - will insert NULL' AS [Migration Status];
            END
            
            -- Build OriginalPrice column
            -- Same stripping logic as Price (keep decimal point)
            IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'OriginalPrice')
            BEGIN
                SET @hasOriginalPriceCol = 1;
                SET @priceSql = @priceSql + N'
                CASE
                    WHEN LOWER(g.OriginalPrice) LIKE ''free%'' THEN 0
                    ELSE TRY_CAST(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(
                                        REPLACE(g.OriginalPrice, ''HK$'', ''''),
                                        ''$'', ''''
                                    ),
                                    ''USD'', ''''
                                ),
                                '','', ''''
                            ),
                            '' '', ''''
                        ) AS DECIMAL(18,2)
                    )
                END AS OriginalPrice,';
                SELECT 'Found OriginalPrice column (PascalCase)' AS [Migration Status];
            END
            ELSE IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'original_price')
            BEGIN
                SET @hasOriginalPriceCol = 1;
                SET @priceSql = @priceSql + N'
                CASE
                    WHEN LOWER(g.original_price) LIKE ''free%'' THEN 0
                    ELSE TRY_CAST(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(
                                        REPLACE(g.original_price, ''HK$'', ''''),
                                        ''$'', ''''
                                    ),
                                    ''USD'', ''''
                                ),
                                '','', ''''
                            ),
                            '' '', ''''
                        ) AS DECIMAL(18,2)
                    )
                END AS OriginalPrice,';
                SELECT 'Found original_price column (snake_case)' AS [Migration Status];
            END
            ELSE
            BEGIN
                SET @priceSql = @priceSql + N'
                NULL AS OriginalPrice,';
                SELECT 'No OriginalPrice column found - will insert NULL' AS [Migration Status];
            END
            
            -- Build DiscountPercent column
            IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'DiscountPercent')
                SET @priceSql = @priceSql + N'
                g.DiscountPercent AS DiscountPercent,';
            ELSE IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'discount_percent')
                SET @priceSql = @priceSql + N'
                g.discount_percent AS DiscountPercent,';
            ELSE
                SET @priceSql = @priceSql + N'
                NULL AS DiscountPercent,';
            
            -- Build CurrencyCode column (for current/discounted price)
            IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'CurrencyCode')
                SET @priceSql = @priceSql + N'
                COALESCE(g.CurrencyCode, ''USD'') AS CurrencyCode,';
            ELSE IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'currency_code')
                SET @priceSql = @priceSql + N'
                COALESCE(g.currency_code, ''USD'') AS CurrencyCode,';
            ELSE IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'Currency')
                SET @priceSql = @priceSql + N'
                COALESCE(g.Currency, ''USD'') AS CurrencyCode,';
            ELSE IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'currency')
                SET @priceSql = @priceSql + N'
                COALESCE(g.currency, ''USD'') AS CurrencyCode,';
            ELSE
                SET @priceSql = @priceSql + N'
                ''USD'' AS CurrencyCode,';

            -- Build OriginalCurrencyCode column, based only on original price prefix/symbol
            IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'OriginalPrice')
                SET @priceSql = @priceSql + N'
                CASE
                    WHEN g.OriginalPrice LIKE ''HK$%'' THEN ''HKD''
                    WHEN g.OriginalPrice LIKE ''$%'' THEN ''USD''
                    ELSE NULL
                END AS OriginalCurrencyCode,';
            ELSE IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'original_price')
                SET @priceSql = @priceSql + N'
                CASE
                    WHEN g.original_price LIKE ''HK$%'' THEN ''HKD''
                    WHEN g.original_price LIKE ''$%'' THEN ''USD''
                    ELSE NULL
                END AS OriginalCurrencyCode,';
            ELSE
                SET @priceSql = @priceSql + N'
                NULL AS OriginalCurrencyCode,';
            
            SET @priceSql = @priceSql + N'
                GETUTCDATE() AS RecordedAt
            FROM dbo.SteamGames g
            WHERE NOT EXISTS (SELECT 1 FROM dbo.SteamGamePrices gp WHERE gp.GameId = g.Id)';
            
            -- Note: We're migrating ALL games, even if they don't have price data
            -- This ensures every game has a price record (with NULL values if no price data exists)
            -- If you only want to migrate games with actual price data, uncomment the WHERE clause below
            
            -- Optional: Only migrate games that have at least one price-related field
            -- DECLARE @priceWhere NVARCHAR(MAX) = N'';
            -- IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'Price')
            --     SET @priceWhere = @priceWhere + N'(g.Price IS NOT NULL AND g.Price != '''')';
            -- ... (add similar checks for other price columns)
            -- IF LEN(@priceWhere) > 0
            --     SET @priceSql = @priceSql + N' AND (' + @priceWhere + N')';
            
            SET @priceSql = @priceSql + N';';
            
            -- Execute and get row count
            DECLARE @rowCount INT;
            EXEC sp_executesql @priceSql;
            SET @rowCount = @@ROWCOUNT;
            SELECT CAST(@rowCount AS NVARCHAR(10)) + ' price records migrated.' AS [Migration Status];
            
            -- Verify data was inserted and show sample
            DECLARE @verifyCount INT;
            SELECT @verifyCount = COUNT(*) FROM dbo.SteamGamePrices WHERE Price IS NOT NULL OR OriginalPrice IS NOT NULL;
            SELECT CAST(@verifyCount AS NVARCHAR(10)) + ' price records have non-NULL price data.' AS [Migration Status];
            
            -- Show sample of migrated data
            IF @verifyCount > 0
            BEGIN
                SELECT TOP 5 
                    gp.Id, 
                    gp.GameId, 
                    g.Name AS GameName,
                    gp.Price, 
                    gp.OriginalPrice, 
                    gp.DiscountPercent, 
                    gp.CurrencyCode,
                    gp.OriginalCurrencyCode,
                    gp.RecordedAt
                FROM dbo.SteamGamePrices gp
                INNER JOIN dbo.SteamGames g ON gp.GameId = g.Id
                WHERE gp.Price IS NOT NULL OR gp.OriginalPrice IS NOT NULL
                ORDER BY gp.RecordedAt DESC;
            END
            ELSE
            BEGIN
                SELECT 'WARNING: No price data was migrated. Checking source data...' AS [Migration Warning];
                -- Check if source data exists
                IF @hasPriceCol = 1 OR @hasOriginalPriceCol = 1
                BEGIN
                    DECLARE @sourceCheckSql NVARCHAR(MAX) = N'SELECT TOP 5 Id, Name, ';
                    IF @hasPriceCol = 1
                        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'Price')
                            SET @sourceCheckSql = @sourceCheckSql + N'Price, ';
                        ELSE
                            SET @sourceCheckSql = @sourceCheckSql + N'price, ';
                    IF @hasOriginalPriceCol = 1
                        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'OriginalPrice')
                            SET @sourceCheckSql = @sourceCheckSql + N'OriginalPrice ';
                        ELSE
                            SET @sourceCheckSql = @sourceCheckSql + N'original_price ';
                    SET @sourceCheckSql = @sourceCheckSql + N'FROM dbo.SteamGames WHERE ';
                    IF @hasPriceCol = 1
                        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'Price')
                            SET @sourceCheckSql = @sourceCheckSql + N'Price IS NOT NULL';
                        ELSE
                            SET @sourceCheckSql = @sourceCheckSql + N'price IS NOT NULL';
                    ELSE IF @hasOriginalPriceCol = 1
                        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'OriginalPrice')
                            SET @sourceCheckSql = @sourceCheckSql + N'OriginalPrice IS NOT NULL';
                        ELSE
                            SET @sourceCheckSql = @sourceCheckSql + N'original_price IS NOT NULL';
                    EXEC sp_executesql @sourceCheckSql;
                END
            END
            
            SELECT 'Price data migrated successfully.' AS [Migration Status];
        END
    END
    
    -- Migrate review data from SteamGames to SteamGameReviews
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGames')
        AND EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamGameReviews')
    BEGIN
        -- For convenience during development/testing, clear existing review records
        DELETE FROM dbo.SteamGameReviews;
        SELECT 'Cleared existing rows from SteamGameReviews before migration.' AS [Migration Status];

        SELECT 'Migrating review data from SteamGames to SteamGameReviews...' AS [Migration Status];
        
        -- Check which columns exist and build dynamic SQL
        DECLARE @reviewSql NVARCHAR(MAX) = N'';
        DECLARE @hasAnyReviewColumn BIT = 0;
        
        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name IN ('MetacriticScore', 'metacritic_score', 'Recommendations', 'recommendations'))
        BEGIN
            SET @hasAnyReviewColumn = 1;
            
            SET @reviewSql = N'
            INSERT INTO dbo.SteamGameReviews (GameId, MetacriticScore, Recommendations, RecordedAt)
            SELECT 
                g.Id AS GameId,';
            
            -- Build MetacriticScore column
            IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'MetacriticScore')
                SET @reviewSql = @reviewSql + N'
                g.MetacriticScore AS MetacriticScore,';
            ELSE IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'metacritic_score')
                SET @reviewSql = @reviewSql + N'
                g.metacritic_score AS MetacriticScore,';
            ELSE
                SET @reviewSql = @reviewSql + N'
                NULL AS MetacriticScore,';
            
            -- Build Recommendations column
            IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'Recommendations')
                SET @reviewSql = @reviewSql + N'
                g.Recommendations AS Recommendations,';
            ELSE IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'recommendations')
                SET @reviewSql = @reviewSql + N'
                g.recommendations AS Recommendations,';
            ELSE
                SET @reviewSql = @reviewSql + N'
                NULL AS Recommendations,';
            
            SET @reviewSql = @reviewSql + N'
                GETUTCDATE() AS RecordedAt
            FROM dbo.SteamGames g
            WHERE NOT EXISTS (SELECT 1 FROM dbo.SteamGameReviews gr WHERE gr.GameId = g.Id)';
            
            -- Add WHERE clause for non-null values (only for columns that exist)
            DECLARE @reviewWhere NVARCHAR(MAX) = N'';
            IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'MetacriticScore')
                SET @reviewWhere = @reviewWhere + N'g.MetacriticScore IS NOT NULL';
            ELSE IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'metacritic_score')
                SET @reviewWhere = @reviewWhere + N'g.metacritic_score IS NOT NULL';
            
            IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'Recommendations')
            BEGIN
                IF LEN(@reviewWhere) > 0 SET @reviewWhere = @reviewWhere + N' OR ';
                SET @reviewWhere = @reviewWhere + N'g.Recommendations IS NOT NULL';
            END
            ELSE IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamGames') AND name = 'recommendations')
            BEGIN
                IF LEN(@reviewWhere) > 0 SET @reviewWhere = @reviewWhere + N' OR ';
                SET @reviewWhere = @reviewWhere + N'g.recommendations IS NOT NULL';
            END
            
            -- Add WHERE clause only if we have valid conditions (not empty)
            SET @reviewWhere = LTRIM(RTRIM(@reviewWhere));
            IF LEN(@reviewWhere) > 0
                SET @reviewSql = @reviewSql + N' AND (' + @reviewWhere + N')';
            
            SET @reviewSql = @reviewSql + N';';
            
            -- Execute and get row count
            DECLARE @reviewRowCount INT;
            EXEC sp_executesql @reviewSql;
            SET @reviewRowCount = @@ROWCOUNT;
            SELECT CAST(@reviewRowCount AS NVARCHAR(10)) + ' review records migrated.' AS [Migration Status];
            
            SELECT 'Review data migrated successfully.' AS [Migration Status];
        END
    END
    
    SELECT 'Step 4 complete: Data migrated to new tables.' AS [Migration Status];
    
    COMMIT TRANSACTION;
    SELECT 'Transaction committed successfully.' AS [Migration Status];
    
END TRY
BEGIN CATCH
    DECLARE @errorMsg NVARCHAR(MAX) = ERROR_MESSAGE();
    SELECT 'Error occurred during Step 4:' AS [Migration Error];
    SELECT @errorMsg AS [Error Message];
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;

