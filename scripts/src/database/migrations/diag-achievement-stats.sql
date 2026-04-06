-- Diagnose current state of SteamAchievementStats
-- This script is for documentation/troubleshooting only.
-- It is not part of the main numbered migration steps.

-- Diagnostic query to check the current state of SteamAchievementStats table
-- Run this BEFORE running the migration to see what we're working with

SELECT 
    'Table Exists' AS CheckType,
    CASE WHEN EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamAchievementStats') 
         THEN 'YES' ELSE 'NO' END AS Result;

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SteamAchievementStats')
BEGIN
    -- Check if column exists
    SELECT 
        'Column Exists' AS CheckType,
        CASE WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SteamAchievementStats') AND name = 'AchievementId') 
             THEN 'YES' ELSE 'NO' END AS Result;
    
    -- Get column details
    SELECT 
        c.name AS ColumnName,
        TYPE_NAME(c.system_type_id) AS DataType,
        c.max_length AS MaxLength,
        c.is_nullable AS IsNullable,
        c.is_identity AS IsIdentity,
        c.default_object_id AS HasDefault,
        dc.name AS DefaultConstraintName,
        dc.definition AS DefaultDefinition
    FROM sys.columns c
    LEFT JOIN sys.default_constraints dc ON c.default_object_id = dc.object_id
    WHERE c.object_id = OBJECT_ID('SteamAchievementStats') 
      AND c.name = 'AchievementId';
    
    -- Check for NULL values
    SELECT 
        'NULL Values Count' AS CheckType,
        COUNT(*) AS Count
    FROM SteamAchievementStats 
    WHERE AchievementId IS NULL;
    
    -- Check for PRIMARY KEY
    SELECT 
        'PRIMARY KEY Exists' AS CheckType,
        CASE WHEN EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('SteamAchievementStats') AND type = 'PK') 
             THEN 'YES' ELSE 'NO' END AS Result,
        kc.name AS ConstraintName
    FROM sys.key_constraints kc
    WHERE kc.parent_object_id = OBJECT_ID('SteamAchievementStats') AND kc.type = 'PK';
    
    -- Check for other constraints
    SELECT 
        'Other Constraints' AS CheckType,
        kc.name AS ConstraintName,
        kc.type_desc AS ConstraintType
    FROM sys.key_constraints kc
    WHERE kc.parent_object_id = OBJECT_ID('SteamAchievementStats');
    
    -- Show sample data
    SELECT TOP 5 
        'Sample Data' AS CheckType,
        AchievementId,
        GlobalPercentage,
        UpdateDate
    FROM SteamAchievementStats;
END
ELSE
BEGIN
    SELECT 'Table does not exist' AS Message;
END

