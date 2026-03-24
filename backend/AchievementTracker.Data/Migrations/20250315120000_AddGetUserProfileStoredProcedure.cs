using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AchievementTracker.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddGetUserProfileStoredProcedure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var sql = @"
CREATE OR ALTER PROCEDURE dbo.GetUserProfile
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
WHERE ua.SteamId = @SteamId AND ua.IsActive = 1 AND a.IsActive = 1 ORDER BY a.Points DESC, a.Id ASC OFFSET @AchievementsByPointsOffset ROWS FETCH NEXT @AchievementsByPointsPageSize ROWS ONLY;
";
            migrationBuilder.Sql(sql.Trim());
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP PROCEDURE IF EXISTS dbo.GetUserProfile;");
        }
    }
}
