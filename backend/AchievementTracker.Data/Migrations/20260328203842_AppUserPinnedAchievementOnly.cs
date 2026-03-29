using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AchievementTracker.Data.Migrations
{
    /// <inheritdoc />
    public partial class AppUserPinnedAchievementOnly : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppUserPinnedAchievement",
                columns: table => new
                {
                    AppUserPinnedAchievementId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AppUserId = table.Column<int>(type: "int", nullable: false),
                    AchievementId = table.Column<int>(type: "int", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppUserPinnedAchievement", x => x.AppUserPinnedAchievementId);
                    table.ForeignKey(
                        name: "FK_AppUserPinnedAchievement_AppUsers_AppUserId",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AppUserPinnedAchievement_SteamAchievements_AchievementId",
                        column: x => x.AchievementId,
                        principalTable: "SteamAchievements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppUserPinnedAchievement_AchievementId",
                table: "AppUserPinnedAchievement",
                column: "AchievementId");

            migrationBuilder.CreateIndex(
                name: "IX_AppUserPinnedAchievement_AppUserId_AchievementId",
                table: "AppUserPinnedAchievement",
                columns: new[] { "AppUserId", "AchievementId" },
                unique: true,
                filter: "[IsActive] = 1");

            migrationBuilder.Sql(@"CREATE OR ALTER PROCEDURE dbo.GetUserProfile
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

SELECT TOP (1) @AppUserId = el.AppUserId
FROM dbo.UserSteamProfiles p
INNER JOIN dbo.UserExternalLogins el ON el.UserExternalLoginId = p.UserExternalLoginId
WHERE p.SteamId = @SteamId AND p.IsActive = 1 AND el.IsActive = 1 AND el.AuthProvider = 1;

SELECT p.ProfileUrl, p.AvatarSmallUrl, p.LastCheckedDate, p.LastSyncedDate, p.IsPrivate
FROM dbo.UserSteamProfiles p
WHERE p.SteamId = @SteamId AND p.IsActive = 1;

SELECT
    (SELECT ISNULL(SUM(a.Points), 0) FROM dbo.SteamUserAchievements ua INNER JOIN dbo.SteamAchievements a ON a.Id = ua.AchievementId WHERE ua.SteamId = @SteamId AND ua.IsActive = 1 AND a.IsActive = 1) AS TotalPoints,
    (SELECT COUNT(*) FROM dbo.SteamUserAchievements ua WHERE ua.SteamId = @SteamId AND ua.IsActive = 1) AS TotalAchievements,
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

SELECT @AchievementsTotalCount = COUNT(*) FROM dbo.SteamUserAchievements ua WHERE ua.SteamId = @SteamId AND ua.IsActive = 1;

SELECT g.Id AS GameId, g.Name AS GameName, a.Name AS AchievementName, a.IconUrl, a.Description, stat.GlobalPercentage AS Rarity, ua.UnlockedAt AS UnlockDate, a.Points
FROM dbo.SteamUserAchievements ua
INNER JOIN dbo.SteamAchievements a ON a.Id = ua.AchievementId
INNER JOIN dbo.SteamGames g ON g.Id = a.GameId AND g.IsActive = 1
LEFT JOIN dbo.SteamAchievementStats stat ON stat.AchievementId = a.Id
WHERE ua.SteamId = @SteamId AND ua.IsActive = 1 AND a.IsActive = 1 ORDER BY ua.UnlockedAt DESC OFFSET @AchievementsOffset ROWS FETCH NEXT @AchievementsPageSize ROWS ONLY;

SELECT @AchievementsByPointsTotalCount = COUNT(*) FROM dbo.SteamUserAchievements ua WHERE ua.SteamId = @SteamId AND ua.IsActive = 1;

SELECT g.Id AS GameId, g.Name AS GameName, a.Name AS AchievementName, a.IconUrl, a.Description, stat.GlobalPercentage AS Rarity, ua.UnlockedAt AS UnlockDate, a.Points
FROM dbo.SteamUserAchievements ua
INNER JOIN dbo.SteamAchievements a ON a.Id = ua.AchievementId
INNER JOIN dbo.SteamGames g ON g.Id = a.GameId AND g.IsActive = 1
LEFT JOIN dbo.SteamAchievementStats stat ON stat.AchievementId = a.Id
WHERE ua.SteamId = @SteamId AND ua.IsActive = 1 AND a.IsActive = 1 ORDER BY a.Points DESC, a.Id ASC OFFSET @AchievementsByPointsOffset ROWS FETCH NEXT @AchievementsByPointsPageSize ROWS ONLY;

SELECT
    pin.DisplayOrder,
    a.Id AS AchievementId,
    g.Id AS GameId,
    g.Name AS GameName,
    a.Name AS AchievementName,
    a.IconUrl,
    a.Description,
    stat.GlobalPercentage AS Rarity,
    ua.UnlockedAt AS UnlockDate,
    a.Points
FROM dbo.AppUserPinnedAchievement pin
INNER JOIN dbo.SteamAchievements a ON a.Id = pin.AchievementId AND a.IsActive = 1
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
        SELECT COUNT(*) FROM dbo.SocialPost p
        WHERE p.AuthorAppUserId = @AppUserId AND p.IsActive = 1) END
    + CASE WHEN @AppUserId IS NULL THEN 0 ELSE (
        SELECT COUNT(*) FROM dbo.SocialPostComment c
        INNER JOIN dbo.SocialPost post ON post.SocialPostId = c.SocialPostId AND post.IsActive = 1
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
    FROM dbo.SocialPost p
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
    FROM dbo.SocialPostComment c
    INNER JOIN dbo.SocialPost post ON post.SocialPostId = c.SocialPostId AND post.IsActive = 1
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
ORDER BY rn;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"CREATE OR ALTER PROCEDURE dbo.GetUserProfile
    @SteamId BIGINT,
    @GamesPageNumber INT = 1,
    @GamesPageSize INT = 25,
    @AchievementsPageNumber INT = 1,
    @AchievementsPageSize INT = 100,
    @AchievementsByPointsPageNumber INT = 1,
    @AchievementsByPointsPageSize INT = 100,
    @GamesRecentTotalCount INT OUTPUT,
    @AchievementsTotalCount INT OUTPUT,
    @AchievementsByPointsTotalCount INT OUTPUT
AS
SET NOCOUNT ON;

DECLARE @GamesRecentOffset INT = (@GamesPageNumber - 1) * @GamesPageSize;
DECLARE @AchievementsOffset INT = (@AchievementsPageNumber - 1) * @AchievementsPageSize;
DECLARE @AchievementsByPointsOffset INT = (@AchievementsByPointsPageNumber - 1) * @AchievementsByPointsPageSize;

SELECT p.ProfileUrl, p.AvatarSmallUrl, p.LastCheckedDate, p.LastSyncedDate, p.IsPrivate
FROM dbo.UserSteamProfiles p
WHERE p.SteamId = @SteamId AND p.IsActive = 1;

SELECT
    (SELECT ISNULL(SUM(a.Points), 0) FROM dbo.SteamUserAchievements ua INNER JOIN dbo.SteamAchievements a ON a.Id = ua.AchievementId WHERE ua.SteamId = @SteamId AND ua.IsActive = 1 AND a.IsActive = 1) AS TotalPoints,
    (SELECT COUNT(*) FROM dbo.SteamUserAchievements ua WHERE ua.SteamId = @SteamId AND ua.IsActive = 1) AS TotalAchievements,
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

SELECT @AchievementsTotalCount = COUNT(*) FROM dbo.SteamUserAchievements ua WHERE ua.SteamId = @SteamId AND ua.IsActive = 1;

SELECT g.Id AS GameId, g.Name AS GameName, a.Name AS AchievementName, a.IconUrl, a.Description, stat.GlobalPercentage AS Rarity, ua.UnlockedAt AS UnlockDate, a.Points
FROM dbo.SteamUserAchievements ua
INNER JOIN dbo.SteamAchievements a ON a.Id = ua.AchievementId
INNER JOIN dbo.SteamGames g ON g.Id = a.GameId AND g.IsActive = 1
LEFT JOIN dbo.SteamAchievementStats stat ON stat.AchievementId = a.Id
WHERE ua.SteamId = @SteamId AND ua.IsActive = 1 AND a.IsActive = 1 ORDER BY ua.UnlockedAt DESC OFFSET @AchievementsOffset ROWS FETCH NEXT @AchievementsPageSize ROWS ONLY;

SELECT @AchievementsByPointsTotalCount = COUNT(*) FROM dbo.SteamUserAchievements ua WHERE ua.SteamId = @SteamId AND ua.IsActive = 1;

SELECT g.Id AS GameId, g.Name AS GameName, a.Name AS AchievementName, a.IconUrl, a.Description, stat.GlobalPercentage AS Rarity, ua.UnlockedAt AS UnlockDate, a.Points
FROM dbo.SteamUserAchievements ua
INNER JOIN dbo.SteamAchievements a ON a.Id = ua.AchievementId
INNER JOIN dbo.SteamGames g ON g.Id = a.GameId AND g.IsActive = 1
LEFT JOIN dbo.SteamAchievementStats stat ON stat.AchievementId = a.Id
WHERE ua.SteamId = @SteamId AND ua.IsActive = 1 AND a.IsActive = 1 ORDER BY a.Points DESC, a.Id ASC OFFSET @AchievementsByPointsOffset ROWS FETCH NEXT @AchievementsByPointsPageSize ROWS ONLY;");

            migrationBuilder.DropTable(name: "AppUserPinnedAchievement");
        }
    }
}
