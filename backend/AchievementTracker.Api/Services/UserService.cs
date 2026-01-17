using AchievementTracker.Models.Dtos;
using AchievementTracker.Models.Options;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;

namespace AchievementTracker.Services;

public interface IUserService
{
    Task<UserProfileDto?> GetUserProfileBySteamIdAsync(string steamId);
}

public class UserService : IUserService
{
    private readonly UserSettings _userSettings;
    private readonly IConfiguration _configuration;

    public UserService(UserSettings userSettings, IConfiguration configuration)
    {
        _userSettings = userSettings;
        _configuration = configuration;
    }

    private string BuildConnectionString()
    {
        // Get database connection values from environment variables
        var user = Environment.GetEnvironmentVariable("DB_USER")
            ?? throw new InvalidOperationException("DB_USER environment variable is not set");
        var password = Environment.GetEnvironmentVariable("DB_PASSWORD")
            ?? throw new InvalidOperationException("DB_PASSWORD environment variable is not set");
        var server = Environment.GetEnvironmentVariable("DB_SERVER");
        var database = Environment.GetEnvironmentVariable("DB_NAME");
        var portStr = Environment.GetEnvironmentVariable("DB_PORT");
        var port = int.TryParse(portStr, out var portInt);

        // Force TCP/IP by always including port number (format: server,port)
        var builder = new SqlConnectionStringBuilder
        {
            UserID = user,
            Password = password,
            DataSource = $"{server},{port}",
            InitialCatalog = database,
            Encrypt = false,
            TrustServerCertificate = true,
            ConnectTimeout = 10
        };

        return builder.ConnectionString;
    }

    public async Task<UserProfileDto?> GetUserProfileBySteamIdAsync(string steamId)
    {
        if (!long.TryParse(steamId, out var steamIdLong))
        {
            return null;
        }

        var connectionString = BuildConnectionString();

        try
        {
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            using var reader = await ExecuteProfileQueryAsync(connection, steamIdLong);

            var userData = await ReadUserDataAsync(reader);
            if (userData == null)
            {
                return null;
            }

            var stats = await ReadUserStatsAsync(reader);
            var activities = await ReadRecentAchievementsAsync(reader, _userSettings);
            var favoriteGames = await ReadTopGamesAsync(reader);

            return BuildUserProfileDto(userData.Value, stats, activities, favoriteGames, steamId, _userSettings);
        }
        catch (SqlException sqlEx)
        {
            throw new InvalidOperationException($"Database connection failed. Please verify SQL Server is running and the connection string in Azure Key Vault is correct. Error: {sqlEx.Message}", sqlEx);
        }
        catch (Exception)
        {
            throw;
        }
    }

    private static async Task<SqlDataReader> ExecuteProfileQueryAsync(SqlConnection connection, long steamIdLong)
    {
        var combinedQuery = @"
            WITH UserData AS (
                SELECT id, steam_id, username, profile_url, avatar_url, created_at
                FROM users
                WHERE steam_id = @SteamId
            ),
            UserStats AS (
                SELECT 
                    u.id as user_id,
                    COUNT(DISTINCT a.game_id) as games_owned,
                    COUNT(ua.id) as total_achievements,
                    COALESCE((
                        SELECT SUM(playtime_forever) 
                        FROM user_games 
                        WHERE user_id = u.id
                    ), 0) as total_playtime_minutes
                FROM users u
                LEFT JOIN user_achievements ua ON u.id = ua.user_id
                LEFT JOIN achievements a ON ua.achievement_id = a.id
                WHERE u.steam_id = @SteamId
                GROUP BY u.id
            ),
            RecentAchievements AS (
                SELECT TOP 10
                    ua.id,
                    ua.unlocked_at,
                    a.name as achievement_name,
                    a.description,
                    a.icon_url as icon,
                    g.name as game_name,
                    g.steam_appid
                FROM users u
                INNER JOIN user_achievements ua ON u.id = ua.user_id
                INNER JOIN achievements a ON ua.achievement_id = a.id
                INNER JOIN games g ON a.game_id = g.id
                WHERE u.steam_id = @SteamId
                ORDER BY ua.unlocked_at DESC
            ),
            TopGames AS (
                SELECT TOP 6
                    g.name,
                    COUNT(ua.id) as achievements_unlocked
                FROM users u
                INNER JOIN user_achievements ua ON u.id = ua.user_id
                INNER JOIN achievements a ON ua.achievement_id = a.id
                INNER JOIN games g ON a.game_id = g.id
                WHERE u.steam_id = @SteamId
                GROUP BY g.id, g.name, g.steam_appid, g.header_image_url
                ORDER BY achievements_unlocked DESC
            )
            SELECT * FROM UserData;
            SELECT * FROM UserStats;
            SELECT * FROM RecentAchievements;
            SELECT * FROM TopGames;
        ";

        using var cmd = new SqlCommand(combinedQuery, connection);
        cmd.Parameters.Add(new SqlParameter("@SteamId", SqlDbType.BigInt) { Value = steamIdLong });

        return await cmd.ExecuteReaderAsync();
    }

    private static async Task<(int userId, string username, string? profileUrl, string? avatarUrl, DateTime createdAt)?> ReadUserDataAsync(SqlDataReader reader)
    {
        if (!await reader.ReadAsync())
        {
            return null;
        }

        var userId = Convert.ToInt32(reader["id"]);
        var username = reader["username"].ToString() ?? string.Empty;
        var profileUrl = reader["profile_url"] == DBNull.Value ? null : reader["profile_url"].ToString();
        var avatarUrl = reader["avatar_url"] == DBNull.Value ? null : reader["avatar_url"].ToString();
        var createdAt = reader["created_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["created_at"]);

        return (userId, username, profileUrl, avatarUrl, createdAt);
    }

    private static async Task<(int gamesOwned, int totalAchievements, int totalPlaytimeMinutes)> ReadUserStatsAsync(SqlDataReader reader)
    {
        int gamesOwned = 0;
        int totalAchievements = 0;
        int totalPlaytimeMinutes = 0;

        await reader.NextResultAsync();
        if (await reader.ReadAsync())
        {
            gamesOwned = reader["games_owned"] == DBNull.Value ? 0 : Convert.ToInt32(reader["games_owned"]);
            totalAchievements = reader["total_achievements"] == DBNull.Value ? 0 : Convert.ToInt32(reader["total_achievements"]);
            totalPlaytimeMinutes = reader["total_playtime_minutes"] == DBNull.Value ? 0 : Convert.ToInt32(reader["total_playtime_minutes"]);
        }

        return (gamesOwned, totalAchievements, totalPlaytimeMinutes);
    }

    private static async Task<List<ActivityItemDto>> ReadRecentAchievementsAsync(SqlDataReader reader, UserSettings userSettings)
    {
        var activities = new List<ActivityItemDto>();

        await reader.NextResultAsync();
        while (await reader.ReadAsync())
        {
            var unlockedAt = reader["unlocked_at"] == DBNull.Value
                ? DateTime.UtcNow
                : Convert.ToDateTime(reader["unlocked_at"]);

            activities.Add(new ActivityItemDto
            {
                Id = Convert.ToInt32(reader["id"]).ToString(),
                Timestamp = unlockedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                Kind = "achievement",
                Title = reader["achievement_name"]?.ToString() ?? userSettings.DefaultAchievementTitle,
                Subtitle = reader["game_name"] == DBNull.Value ? null : reader["game_name"].ToString(),
                Icon = reader["icon"] == DBNull.Value ? null : reader["icon"].ToString()
            });
        }

        return activities;
    }

    private static async Task<List<string>> ReadTopGamesAsync(SqlDataReader reader)
    {
        var favoriteGames = new List<string>();

        await reader.NextResultAsync();
        while (await reader.ReadAsync())
        {
            var gameName = reader["name"]?.ToString();
            if (!string.IsNullOrWhiteSpace(gameName))
            {
                favoriteGames.Add(gameName);
            }
        }

        return favoriteGames;
    }

    private static UserProfileDto BuildUserProfileDto(
        (int userId, string username, string? profileUrl, string? avatarUrl, DateTime createdAt) userData,
        (int gamesOwned, int totalAchievements, int totalPlaytimeMinutes) stats,
        List<ActivityItemDto> activities,
        List<string> favoriteGames,
        string steamId,
        UserSettings userSettings)
    {
        // Convert playtime from minutes to hours (Steam API returns playtime in minutes)
        int hoursPlayed = (int)Math.Round(stats.totalPlaytimeMinutes / 60.0);

        return new UserProfileDto
        {
            Id = userData.userId.ToString(),
            Handle = steamId,
            Username = userData.username,
            AvatarUrl = userData.avatarUrl ?? userSettings.DefaultAvatarUrl,
            Bio = null,
            Location = null,
            JoinDate = userData.createdAt.ToString("yyyy-MM-dd"),
            Platforms = new[] { userSettings.DefaultPlatform },
            LinkedAccounts = new[]
            {
                new LinkedAccountDto
                {
                    Platform = userSettings.DefaultPlatform,
                    UsernameOrId = userData.username,
                    ProfileUrl = userData.profileUrl ?? string.Format(userSettings.SteamProfileUrlTemplate, steamId),
                    AccountVerified = true
                }
            },
            Socials = Array.Empty<SocialLinkDto>(),
            FavoriteGenres = Array.Empty<string>(),
            FavoriteGames = favoriteGames.ToArray(),
            TotalAchievements = stats.totalAchievements,
            HoursPlayed = hoursPlayed,
            GamesOwned = stats.gamesOwned,
            Pins = favoriteGames.Take(3).Select((game, index) => new GamePinDto
            {
                Title = game,
                StatLabel = index == 0 ? userSettings.MostAchievementsLabel : userSettings.TopGameLabel,
                Value = null
            }).ToArray(),
            Activity = activities.ToArray(),
            Privacy = new PrivacyDto
            {
                ShowStats = true,
                ShowActivity = true,
                ShowLinkedAccounts = true
            }
        };
    }
}