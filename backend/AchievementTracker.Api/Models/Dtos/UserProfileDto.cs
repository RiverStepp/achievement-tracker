namespace AchievementTracker.Models.Dtos;

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
