namespace AchievementTracker.Models.Dtos;

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
