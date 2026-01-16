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
    private readonly IConfiguration _configuration;
    private readonly ILogger<UserService> _logger;

    public UserService(IConfiguration configuration, ILogger<UserService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    private string BuildConnectionString()
    {
        // Hardcoded values - same as Node.js connection file defaults
        const string user = "Cursor";
        const string password = "Completion100";
        const string server = "localhost";
        const string database = "Steam-Games-Achievements";
        const int port = 1433;

        _logger.LogInformation("Building connection string - Server: {Server}, Port: {Port}, Database: {Database}, User: {User}",
            server, port, database, user);

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

        _logger.LogInformation("Built connection string (password masked): Server={Server}, Database={Database}, User={User}",
            builder.DataSource, builder.InitialCatalog, builder.UserID);

        return builder.ConnectionString;
    }

    public async Task<UserProfileDto?> GetUserProfileBySteamIdAsync(string steamId)
    {
        // Build connection string from environment variables (same pattern as Node.js connection file)
        var connectionString = BuildConnectionString();

        if (!long.TryParse(steamId, out var steamIdLong))
        {
            _logger.LogWarning("Invalid Steam ID format: {SteamId}", steamId);
            return null;
        }

        try
        {
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();
            _logger.LogInformation("Successfully connected to database for Steam ID: {SteamId}", steamId);

            // Get user data
            var userQuery = @"
            SELECT id, steam_id, username, profile_url, avatar_url, created_at
            FROM users
            WHERE steam_id = @SteamId
        ";

            using var userCmd = new SqlCommand(userQuery, connection);
            userCmd.Parameters.AddWithValue("@SteamId", steamIdLong);

            using var userReader = await userCmd.ExecuteReaderAsync();
            if (!await userReader.ReadAsync())
            {
                _logger.LogInformation("User not found in database for Steam ID: {SteamId}", steamId);
                return null; // User not found
            }

            _logger.LogInformation("User found in database for Steam ID: {SteamId}", steamId);

            var userId = Convert.ToInt32(userReader["id"]);
            var username = userReader["username"].ToString() ?? string.Empty;
            var profileUrl = userReader["profile_url"] == DBNull.Value ? null : userReader["profile_url"].ToString();
            var avatarUrl = userReader["avatar_url"] == DBNull.Value ? null : userReader["avatar_url"].ToString();
            var createdAt = userReader["created_at"] == DBNull.Value ? DateTime.Now : Convert.ToDateTime(userReader["created_at"]);

            await userReader.CloseAsync();

            // Get user statistics
            // Games are inferred from user achievements (achievements belong to games)
            var statsQuery = @"
            SELECT 
                COUNT(DISTINCT a.game_id) as games_owned,
                COUNT(ua.id) as total_achievements
            FROM users u
            LEFT JOIN user_achievements ua ON u.id = ua.user_id
            LEFT JOIN achievements a ON ua.achievement_id = a.id
            WHERE u.id = @UserId
            GROUP BY u.id
        ";

            int gamesOwned = 0;
            int totalAchievements = 0;

            using var statsCmd = new SqlCommand(statsQuery, connection);
            statsCmd.Parameters.AddWithValue("@UserId", userId);

            using var statsReader = await statsCmd.ExecuteReaderAsync();
            if (await statsReader.ReadAsync())
            {
                gamesOwned = statsReader["games_owned"] == DBNull.Value ? 0 : Convert.ToInt32(statsReader["games_owned"]);
                totalAchievements = statsReader["total_achievements"] == DBNull.Value ? 0 : Convert.ToInt32(statsReader["total_achievements"]);
            }
            await statsReader.CloseAsync();

            // For now, set playtime to 0 since we don't have per-user playtime data
            // This can be enhanced later if playtime data is stored per user
            int totalPlaytimeHours = 0;

            // Get recent achievements for activity feed
            var achievementsQuery = @"
            SELECT TOP 10
                ua.id,
                ua.unlocked_at,
                a.name as achievement_name,
                a.description,
                a.icon_url as icon,
                g.name as game_name,
                g.steam_appid
            FROM user_achievements ua
            INNER JOIN achievements a ON ua.achievement_id = a.id
            INNER JOIN games g ON a.game_id = g.id
            WHERE ua.user_id = @UserId
            ORDER BY ua.unlocked_at DESC
        ";

            var activities = new List<ActivityItemDto>();
            using var achievementsCmd = new SqlCommand(achievementsQuery, connection);
            achievementsCmd.Parameters.AddWithValue("@UserId", userId);

            using var achievementsReader = await achievementsCmd.ExecuteReaderAsync();
            while (await achievementsReader.ReadAsync())
            {
                var unlockedAt = achievementsReader["unlocked_at"] == DBNull.Value
                    ? DateTime.Now
                    : Convert.ToDateTime(achievementsReader["unlocked_at"]);

                activities.Add(new ActivityItemDto
                {
                    Id = Convert.ToInt32(achievementsReader["id"]).ToString(),
                    Timestamp = unlockedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                    Kind = "achievement",
                    Title = achievementsReader["achievement_name"]?.ToString() ?? "Achievement",
                    Subtitle = achievementsReader["game_name"] == DBNull.Value ? null : achievementsReader["game_name"].ToString(),
                    Icon = achievementsReader["icon"] == DBNull.Value ? null : achievementsReader["icon"].ToString()
                });
            }
            await achievementsReader.CloseAsync();

            // Get top games for pins/favorites (games with most achievements unlocked)
            // Games are inferred from user achievements
            var topGamesQuery = @"
            SELECT TOP 6
                g.id,
                g.name,
                g.steam_appid,
                g.header_image_url,
                COUNT(ua.id) as achievements_unlocked
            FROM user_achievements ua
            INNER JOIN achievements a ON ua.achievement_id = a.id
            INNER JOIN games g ON a.game_id = g.id
            WHERE ua.user_id = @UserId
            GROUP BY g.id, g.name, g.steam_appid, g.header_image_url
            ORDER BY achievements_unlocked DESC
        ";

            var favoriteGames = new List<string>();
            using var topGamesCmd = new SqlCommand(topGamesQuery, connection);
            topGamesCmd.Parameters.AddWithValue("@UserId", userId);

            using var topGamesReader = await topGamesCmd.ExecuteReaderAsync();
            while (await topGamesReader.ReadAsync())
            {
                var gameName = topGamesReader["name"]?.ToString();
                if (!string.IsNullOrWhiteSpace(gameName))
                {
                    favoriteGames.Add(gameName);
                }
            }
            await topGamesReader.CloseAsync();

            return new UserProfileDto
            {
                Id = userId.ToString(),
                Handle = steamId,
                Username = username,
                AvatarUrl = avatarUrl ?? "/default-avatar.png",
                Bio = null,
                Location = null,
                JoinDate = createdAt.ToString("yyyy-MM-dd"),
                Platforms = new[] { "steam" },
                LinkedAccounts = new[]
                {
                new LinkedAccountDto
                {
                    Platform = "steam",
                    UsernameOrId = username,
                    ProfileUrl = profileUrl ?? $"https://steamcommunity.com/profiles/{steamId}",
                    AccountVerified = true
                }
            },
                Socials = Array.Empty<SocialLinkDto>(),
                FavoriteGenres = Array.Empty<string>(),
                FavoriteGames = favoriteGames.ToArray(),
                TotalAchievements = totalAchievements,
                HoursPlayed = totalPlaytimeHours,
                GamesOwned = gamesOwned,
                Pins = favoriteGames.Take(3).Select((game, index) => new GamePinDto
                {
                    Title = game,
                    StatLabel = index == 0 ? "Most achievements" : "Top game",
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
        catch (SqlException sqlEx)
        {
            _logger.LogError(sqlEx, "Database connection error while fetching user profile for Steam ID: {SteamId}", steamId);
            throw new InvalidOperationException($"Database connection failed. Please verify SQL Server is running and the connection string in Azure Key Vault is correct. Error: {sqlEx.Message}", sqlEx);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user profile for Steam ID: {SteamId}", steamId);
            throw;
        }
    }
}

public class UserProfileDto
{
    [System.Text.Json.Serialization.JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("handle")]
    public string Handle { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("username")]
    public string? Username { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("avatarUrl")]
    public string AvatarUrl { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("bannerUrl")]
    public string? BannerUrl { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("bio")]
    public string? Bio { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("location")]
    public string? Location { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("joinDate")]
    public string JoinDate { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("platforms")]
    public string[] Platforms { get; set; } = Array.Empty<string>();

    [System.Text.Json.Serialization.JsonPropertyName("linkedAccounts")]
    public LinkedAccountDto[] LinkedAccounts { get; set; } = Array.Empty<LinkedAccountDto>();

    [System.Text.Json.Serialization.JsonPropertyName("socials")]
    public SocialLinkDto[] Socials { get; set; } = Array.Empty<SocialLinkDto>();

    [System.Text.Json.Serialization.JsonPropertyName("favoriteGenres")]
    public string[] FavoriteGenres { get; set; } = Array.Empty<string>();

    [System.Text.Json.Serialization.JsonPropertyName("favoriteGames")]
    public string[] FavoriteGames { get; set; } = Array.Empty<string>();

    [System.Text.Json.Serialization.JsonPropertyName("totalAchievements")]
    public int TotalAchievements { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("hoursPlayed")]
    public int HoursPlayed { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("gamesOwned")]
    public int GamesOwned { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("pins")]
    public GamePinDto[] Pins { get; set; } = Array.Empty<GamePinDto>();

    [System.Text.Json.Serialization.JsonPropertyName("activity")]
    public ActivityItemDto[] Activity { get; set; } = Array.Empty<ActivityItemDto>();

    [System.Text.Json.Serialization.JsonPropertyName("privacy")]
    public PrivacyDto Privacy { get; set; } = new();
}

public class LinkedAccountDto
{
    [System.Text.Json.Serialization.JsonPropertyName("platform")]
    public string Platform { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("usernameOrId")]
    public string UsernameOrId { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("profileUrl")]
    public string ProfileUrl { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("accountVerified")]
    public bool? AccountVerified { get; set; }
}

public class SocialLinkDto
{
    [System.Text.Json.Serialization.JsonPropertyName("kind")]
    public string Kind { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;
}

public class GamePinDto
{
    [System.Text.Json.Serialization.JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("statLabel")]
    public string StatLabel { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("value")]
    public string? Value { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("achievementIconUrl")]
    public string? AchievementIconUrl { get; set; }
}

public class ActivityItemDto
{
    [System.Text.Json.Serialization.JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("ts")]
    public string Timestamp { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("kind")]
    public string Kind { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("subtitle")]
    public string? Subtitle { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("icon")]
    public string? Icon { get; set; }
}

public class PrivacyDto
{
    [System.Text.Json.Serialization.JsonPropertyName("showStats")]
    public bool ShowStats { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("showActivity")]
    public bool ShowActivity { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("showLinkedAccounts")]
    public bool ShowLinkedAccounts { get; set; }
}