CREATE OR ALTER PROCEDURE dbo.GetUserProfile
    @SteamId BIGINT,
    @GamesPageNumber INT = 1,
    @GamesPageSize INT = 25,
    @AchievementsPageNumber INT = 1,
    @AchievementsPageSize INT = 100,
    @AchievementsByPointsPageNumber INT = 1,
    @AchievementsByPointsPageSize INT = 100,
    @LatestActivityPageNumber INT = 1,
    @LatestActivityPageSize INT = 25,
    @GamesRecentTotalCount INT OUTPUT,
    @AchievementsTotalCount INT OUTPUT,
    @AchievementsByPointsTotalCount INT OUTPUT,
    @LatestActivityTotalCount INT OUTPUT
AS
SET NOCOUNT ON;

DECLARE @GamesRecentOffset INT = (@GamesPageNumber - 1) * @GamesPageSize;
DECLARE @AchievementsOffset INT = (@AchievementsPageNumber - 1) * @AchievementsPageSize;
DECLARE @AchievementsByPointsOffset INT =
    (@AchievementsByPointsPageNumber - 1) * @AchievementsByPointsPageSize;
DECLARE @LatestActivityOffset INT = (@LatestActivityPageNumber - 1) * @LatestActivityPageSize;
DECLARE @AppUserId INT;
-- Steam store pins; must match eAchievementPlatform.Steam in AchievementTracker.Data.
-- TODO: Add other platforms here in the future!
DECLARE @SteamAchievementPlatform TINYINT = CAST(1 AS TINYINT);

SELECT TOP (1) @AppUserId = el.AppUserId
FROM dbo.UserSteamProfiles p
INNER JOIN dbo.UserExternalLogins el ON el.UserExternalLoginId = p.UserExternalLoginId
WHERE p.SteamId = @SteamId AND p.IsActive = 1 AND el.IsActive = 1 AND el.AuthProvider = 1;

CREATE TABLE #UserProfile (
    Handle NVARCHAR(15) NULL,
    DisplayName NVARCHAR(20) NULL,
    Bio NVARCHAR(500) NULL,
    Pronouns NVARCHAR(120) NULL,
    LocationCountryId INT NULL,
    CountryName NVARCHAR(120) NULL,
    LocationStateRegionId INT NULL,
    StateName NVARCHAR(120) NULL,
    LocationCityId INT NULL,
    CityName NVARCHAR(120) NULL,
    TimeZoneDisplayName NVARCHAR(200) NULL,
    JoinDate DATETIME2 NOT NULL,
    ProfileImageUrl NVARCHAR(2048) NULL,
    BannerImageUrl NVARCHAR(2048) NULL
);

DECLARE @ProfileImageColumnExpr NVARCHAR(128) =
    CASE
        WHEN COL_LENGTH('dbo.AppUsers', 'ProfileImageUrl') IS NOT NULL THEN N'u.ProfileImageUrl'
        ELSE N'CAST(NULL AS NVARCHAR(2048))'
    END;

DECLARE @BannerImageColumnExpr NVARCHAR(128) =
    CASE
        WHEN COL_LENGTH('dbo.AppUsers', 'BannerImageUrl') IS NOT NULL THEN N'u.BannerImageUrl'
        ELSE N'CAST(NULL AS NVARCHAR(2048))'
    END;

DECLARE @UserProfileSql NVARCHAR(MAX) =
N'INSERT INTO #UserProfile (
    Handle,
    DisplayName,
    Bio,
    Pronouns,
    LocationCountryId,
    CountryName,
    LocationStateRegionId,
    StateName,
    LocationCityId,
    CityName,
    TimeZoneDisplayName,
    JoinDate,
    ProfileImageUrl,
    BannerImageUrl
)
SELECT
    u.Handle,
    u.DisplayName,
    u.Bio,
    po.DisplayLabel AS Pronouns,
    COALESCE(cDirect.LocationCountryId, cViaState.LocationCountryId, cViaCity.LocationCountryId) AS LocationCountryId,
    COALESCE(cDirect.Name, cViaState.Name, cViaCity.Name) AS CountryName,
    COALESCE(srDirect.LocationStateRegionId, srViaCity.LocationStateRegionId) AS LocationStateRegionId,
    COALESCE(srDirect.Name, srViaCity.Name) AS StateName,
    ct.LocationCityId AS LocationCityId,
    ct.Name AS CityName,
    tz.DisplayName AS TimeZoneDisplayName,
    u.CreateDate AS JoinDate,
    ' + @ProfileImageColumnExpr + N' AS ProfileImageUrl,
    ' + @BannerImageColumnExpr + N' AS BannerImageUrl
FROM dbo.AppUsers u
LEFT JOIN dbo.PronounOptions po ON po.PronounOptionId = u.PronounOptionId
LEFT JOIN dbo.IanaTimeZones tz ON tz.IanaTimeZoneId = u.IanaTimeZoneId
LEFT JOIN dbo.LocationCities ct ON ct.LocationCityId = u.LocationCityId
LEFT JOIN dbo.LocationStateRegions srViaCity ON srViaCity.LocationStateRegionId = ct.LocationStateRegionId
LEFT JOIN dbo.LocationCountries cViaCity ON cViaCity.LocationCountryId = srViaCity.LocationCountryId
LEFT JOIN dbo.LocationStateRegions srDirect ON srDirect.LocationStateRegionId = u.LocationStateRegionId
LEFT JOIN dbo.LocationCountries cViaState ON cViaState.LocationCountryId = srDirect.LocationCountryId
LEFT JOIN dbo.LocationCountries cDirect ON cDirect.LocationCountryId = u.LocationCountryId
WHERE u.AppUserId = @AppUserId AND u.IsActive = 1;';

EXEC sp_executesql @UserProfileSql, N'@AppUserId INT', @AppUserId;

SELECT
    Handle,
    DisplayName,
    Bio,
    Pronouns,
    LocationCountryId,
    CountryName,
    LocationStateRegionId,
    StateName,
    LocationCityId,
    CityName,
    TimeZoneDisplayName,
    JoinDate,
    ProfileImageUrl,
    BannerImageUrl
FROM #UserProfile;

SELECT l.Platform, l.LinkValue
FROM dbo.AppUserSocialLinks l
WHERE l.AppUserId = @AppUserId AND l.IsActive = 1 AND l.IsVisible = 1
ORDER BY l.Platform ASC;

SELECT p.ProfileUrl, p.AvatarSmallUrl, p.LastCheckedDate, p.LastSyncedDate, p.IsPrivate
FROM dbo.UserSteamProfiles p
WHERE p.SteamId = @SteamId AND p.IsActive = 1;

SELECT
    (SELECT ISNULL(SUM(a.Points), 0) FROM dbo.SteamUserAchievements ua INNER JOIN dbo.SteamAchievements a ON a.Id = ua.AchievementId WHERE ua.SteamId = @SteamId AND ua.IsActive = 1 AND a.IsActive = 1) AS TotalPoints,
    (SELECT COUNT(*) FROM dbo.SteamUserAchievements ua INNER JOIN dbo.SteamAchievements a ON a.Id = ua.AchievementId AND a.IsActive = 1 INNER JOIN dbo.SteamGames g ON g.Id = a.GameId AND g.IsActive = 1 WHERE ua.SteamId = @SteamId AND ua.IsActive = 1) AS TotalAchievements,
    (SELECT ISNULL(SUM(ug.PlaytimeForever), 0) FROM dbo.SteamUserGames ug WHERE ug.SteamId = @SteamId AND ug.IsActive = 1) AS TotalPlaytimeMinutes,
    (SELECT COUNT(*) FROM (SELECT g.Id FROM dbo.SteamUserAchievements ua2 INNER JOIN dbo.SteamAchievements a ON a.Id = ua2.AchievementId INNER JOIN dbo.SteamGames g ON g.Id = a.GameId WHERE ua2.SteamId = @SteamId AND ua2.IsActive = 1 AND a.IsActive = 1 AND g.IsActive = 1 GROUP BY g.Id HAVING COUNT(*) = (SELECT COUNT(*) FROM dbo.SteamAchievements a2 WHERE a2.GameId = g.Id AND a2.IsActive = 1)) x) AS GamesAt100Percent,
    (SELECT COUNT(DISTINCT a.GameId) FROM dbo.SteamUserAchievements ua2 INNER JOIN dbo.SteamAchievements a ON a.Id = ua2.AchievementId WHERE ua2.SteamId = @SteamId AND ua2.IsActive = 1 AND a.IsActive = 1) AS StartedGamesCount,
    (SELECT COUNT(*) FROM dbo.SteamUserGames ug WHERE ug.SteamId = @SteamId AND ug.IsActive = 1) AS OwnedGamesCount,
    (SELECT CASE WHEN COUNT(*) = 0 THEN NULL ELSE SUM(earned * 1.0 / NULLIF(total_ach, 0)) * 1.0 / COUNT(*) END FROM (SELECT g.Id AS GameKey, COUNT(ua2.AchievementId) AS earned, (SELECT COUNT(*) FROM dbo.SteamAchievements a2 WHERE a2.GameId = g.Id AND a2.IsActive = 1) AS total_ach FROM dbo.SteamUserAchievements ua2 INNER JOIN dbo.SteamAchievements a ON a.Id = ua2.AchievementId INNER JOIN dbo.SteamGames g ON g.Id = a.GameId WHERE ua2.SteamId = @SteamId AND ua2.IsActive = 1 AND a.IsActive = 1 AND g.IsActive = 1 GROUP BY g.Id) pergame WHERE total_ach > 0) AS AvgCompletionPercent;

SELECT @GamesRecentTotalCount = COUNT(*) FROM (SELECT g.Id FROM dbo.SteamUserAchievements ua INNER JOIN dbo.SteamAchievements a ON a.Id = ua.AchievementId INNER JOIN dbo.SteamGames g ON g.Id = a.GameId WHERE ua.SteamId = @SteamId AND ua.IsActive = 1 AND a.IsActive = 1 AND g.IsActive = 1 GROUP BY g.Id) recent;

;WITH RecentGames AS (
    SELECT g.Id AS GameId, g.Name AS GameName, g.HeaderImageUrl, MAX(ug.PlaytimeForever) AS PlaytimeForever, COUNT(ua.AchievementId) AS EarnedCount,
    (SELECT COUNT(*) FROM dbo.SteamAchievements a2 WHERE a2.GameId = g.Id AND a2.IsActive = 1) AS TotalAchievements, SUM(a.Points) AS PointsEarned,
    (SELECT ISNULL(SUM(a2.Points), 0) FROM dbo.SteamAchievements a2 WHERE a2.GameId = g.Id AND a2.IsActive = 1) AS PointsAvailable,
    MAX(ua.UnlockedAt) AS LatestUnlockDate, MIN(ua.UnlockedAt) AS FirstUnlockDate
    FROM dbo.SteamUserAchievements ua INNER JOIN dbo.SteamAchievements a ON a.Id = ua.AchievementId INNER JOIN dbo.SteamGames g ON g.Id = a.GameId
    LEFT JOIN dbo.SteamUserGames ug ON ug.SteamId = ua.SteamId AND ug.GameId = g.Id AND ug.IsActive = 1
    WHERE ua.SteamId = @SteamId AND ua.IsActive = 1 AND a.IsActive = 1 AND g.IsActive = 1 GROUP BY g.Id, g.Name, g.HeaderImageUrl
), OrderedRecent AS (SELECT *, ROW_NUMBER() OVER (ORDER BY LatestUnlockDate DESC) AS rn FROM RecentGames)
SELECT GameName, HeaderImageUrl, PlaytimeForever, EarnedCount, TotalAchievements, CASE WHEN TotalAchievements = 0 THEN NULL ELSE EarnedCount * 100.0 / TotalAchievements END AS PercentCompletion, CASE WHEN EarnedCount >= TotalAchievements AND TotalAchievements > 0 THEN 1 ELSE 0 END AS IsCompleted, PointsEarned, PointsAvailable, LatestUnlockDate, CASE WHEN EarnedCount > 1 THEN DATEDIFF(MINUTE, FirstUnlockDate, LatestUnlockDate) ELSE NULL END AS DurationMinutes
FROM OrderedRecent WHERE rn > @GamesRecentOffset AND rn <= @GamesRecentOffset + @GamesPageSize ORDER BY rn;

SELECT @AchievementsTotalCount = COUNT(*)
FROM dbo.SteamUserAchievements ua
INNER JOIN dbo.SteamAchievements a ON a.Id = ua.AchievementId AND a.IsActive = 1
INNER JOIN dbo.SteamGames g ON g.Id = a.GameId AND g.IsActive = 1
WHERE ua.SteamId = @SteamId AND ua.IsActive = 1;

SELECT g.Id AS GameId, g.Name AS GameName, a.Name AS AchievementName, a.IconUrl, a.Description, stat.GlobalPercentage AS Rarity, ua.UnlockedAt AS UnlockDate, a.Points
FROM dbo.SteamUserAchievements ua
INNER JOIN dbo.SteamAchievements a ON a.Id = ua.AchievementId
INNER JOIN dbo.SteamGames g ON g.Id = a.GameId AND g.IsActive = 1
LEFT JOIN dbo.SteamAchievementStats stat ON stat.AchievementId = a.Id
WHERE ua.SteamId = @SteamId AND ua.IsActive = 1 AND a.IsActive = 1 ORDER BY ua.UnlockedAt DESC OFFSET @AchievementsOffset ROWS FETCH NEXT @AchievementsPageSize ROWS ONLY;

SELECT @AchievementsByPointsTotalCount = COUNT(*)
FROM dbo.SteamUserAchievements ua
INNER JOIN dbo.SteamAchievements a ON a.Id = ua.AchievementId AND a.IsActive = 1
INNER JOIN dbo.SteamGames g ON g.Id = a.GameId AND g.IsActive = 1
WHERE ua.SteamId = @SteamId AND ua.IsActive = 1;

SELECT g.Id AS GameId, g.Name AS GameName, a.Name AS AchievementName, a.IconUrl, a.Description, stat.GlobalPercentage AS Rarity, ua.UnlockedAt AS UnlockDate, a.Points
FROM dbo.SteamUserAchievements ua
INNER JOIN dbo.SteamAchievements a ON a.Id = ua.AchievementId
INNER JOIN dbo.SteamGames g ON g.Id = a.GameId AND g.IsActive = 1
LEFT JOIN dbo.SteamAchievementStats stat ON stat.AchievementId = a.Id
WHERE ua.SteamId = @SteamId AND ua.IsActive = 1 AND a.IsActive = 1 ORDER BY a.Points DESC, a.Id ASC OFFSET @AchievementsByPointsOffset ROWS FETCH NEXT @AchievementsByPointsPageSize ROWS ONLY;

SELECT
    pin.AppUserPinnedAchievementId,
    pin.DisplayOrder,
    pin.PlatformId,
    pin.SteamAchievementId,
    g.Id AS GameId,
    g.Name AS GameName,
    a.Name AS AchievementName,
    a.IconUrl,
    a.Description,
    stat.GlobalPercentage AS Rarity,
    ua.UnlockedAt AS UnlockDate,
    a.Points
FROM dbo.AppUserPinnedAchievements pin
INNER JOIN dbo.SteamAchievements a ON a.Id = pin.SteamAchievementId AND pin.PlatformId = @SteamAchievementPlatform AND a.IsActive = 1
INNER JOIN dbo.SteamGames g ON g.Id = a.GameId AND g.IsActive = 1
LEFT JOIN dbo.SteamAchievementStats stat ON stat.AchievementId = a.Id
INNER JOIN dbo.SteamUserAchievements ua ON ua.AchievementId = a.Id AND ua.SteamId = @SteamId AND ua.IsActive = 1
WHERE pin.AppUserId = @AppUserId AND pin.IsActive = 1 AND @AppUserId IS NOT NULL
ORDER BY pin.DisplayOrder ASC;

SET @LatestActivityTotalCount =
    (SELECT COUNT(*) FROM dbo.SteamUserAchievements ua
     INNER JOIN dbo.SteamAchievements a ON a.Id = ua.AchievementId AND a.IsActive = 1
     INNER JOIN dbo.SteamGames g ON g.Id = a.GameId AND g.IsActive = 1
     WHERE ua.SteamId = @SteamId AND ua.IsActive = 1)
    + CASE WHEN @AppUserId IS NULL THEN 0 ELSE (
        SELECT COUNT(*) FROM dbo.SocialPosts p
        WHERE p.AuthorAppUserId = @AppUserId AND p.IsActive = 1) END
    + CASE WHEN @AppUserId IS NULL THEN 0 ELSE (
        SELECT COUNT(*) FROM dbo.SocialPostComments c
        INNER JOIN dbo.SocialPosts post ON post.SocialPostId = c.SocialPostId AND post.IsActive = 1
        WHERE c.AuthorAppUserId = @AppUserId AND c.IsActive = 1) END;

;WITH Unified AS (
    SELECT
        CAST(1 AS SMALLINT) AS ActivityType,
        ua.UnlockedAt AS ActivityAt,
        g.Id AS GameId,
        g.Name AS GameName,
        a.Name AS AchievementName,
        a.IconUrl,
        a.Description,
        stat.GlobalPercentage AS Rarity,
        a.Points,
        a.Id AS AchievementId,
        CAST(NULL AS UNIQUEIDENTIFIER) AS PostPublicId,
        CAST(NULL AS NVARCHAR(4000)) AS PostContent,
        CAST(NULL AS UNIQUEIDENTIFIER) AS CommentPublicId,
        CAST(NULL AS UNIQUEIDENTIFIER) AS CommentPostPublicId,
        CAST(NULL AS NVARCHAR(4000)) AS CommentBody,
        ua.Id AS TieBreak
    FROM dbo.SteamUserAchievements ua
    INNER JOIN dbo.SteamAchievements a ON a.Id = ua.AchievementId AND a.IsActive = 1
    INNER JOIN dbo.SteamGames g ON g.Id = a.GameId AND g.IsActive = 1
    LEFT JOIN dbo.SteamAchievementStats stat ON stat.AchievementId = a.Id
    WHERE ua.SteamId = @SteamId AND ua.IsActive = 1

    UNION ALL

    SELECT
        CAST(2 AS SMALLINT),
        p.CreateDate,
        CAST(NULL AS INT),
        CAST(NULL AS NVARCHAR(255)),
        CAST(NULL AS NVARCHAR(255)),
        CAST(NULL AS NVARCHAR(500)),
        CAST(NULL AS NVARCHAR(2000)),
        CAST(NULL AS DECIMAL(5, 2)),
        CAST(NULL AS INT),
        CAST(NULL AS INT),
        p.PublicId,
        p.Content,
        CAST(NULL AS UNIQUEIDENTIFIER),
        CAST(NULL AS UNIQUEIDENTIFIER),
        CAST(NULL AS NVARCHAR(4000)),
        p.SocialPostId
    FROM dbo.SocialPosts p
    WHERE @AppUserId IS NOT NULL AND p.AuthorAppUserId = @AppUserId AND p.IsActive = 1

    UNION ALL

    SELECT
        CAST(3 AS SMALLINT),
        c.CreateDate,
        CAST(NULL AS INT),
        CAST(NULL AS NVARCHAR(255)),
        CAST(NULL AS NVARCHAR(255)),
        CAST(NULL AS NVARCHAR(500)),
        CAST(NULL AS NVARCHAR(2000)),
        CAST(NULL AS DECIMAL(5, 2)),
        CAST(NULL AS INT),
        CAST(NULL AS INT),
        CAST(NULL AS UNIQUEIDENTIFIER) AS PostPublicId,
        CAST(NULL AS NVARCHAR(4000)) AS PostContent,
        c.PublicId AS CommentPublicId,
        post.PublicId AS CommentPostPublicId,
        c.Body AS CommentBody,
        c.SocialPostCommentId AS TieBreak
    FROM dbo.SocialPostComments c
    INNER JOIN dbo.SocialPosts post ON post.SocialPostId = c.SocialPostId AND post.IsActive = 1
    WHERE @AppUserId IS NOT NULL AND c.AuthorAppUserId = @AppUserId AND c.IsActive = 1
),
Numbered AS (
    SELECT
        ActivityType,
        ActivityAt,
        GameId,
        GameName,
        AchievementName,
        IconUrl,
        Description,
        Rarity,
        Points,
        AchievementId,
        PostPublicId,
        PostContent,
        CommentPublicId,
        CommentPostPublicId,
        CommentBody,
        ROW_NUMBER() OVER (ORDER BY ActivityAt DESC, ActivityType ASC, TieBreak DESC) AS rn
    FROM Unified
)
SELECT
    ActivityType,
    ActivityAt,
    GameId,
    GameName,
    AchievementName,
    IconUrl,
    Description,
    Rarity,
    Points,
    AchievementId,
    PostPublicId,
    PostContent,
    CommentPublicId,
    CommentPostPublicId,
    CommentBody
FROM Numbered
WHERE rn > @LatestActivityOffset AND rn <= @LatestActivityOffset + @LatestActivityPageSize
ORDER BY rn;
