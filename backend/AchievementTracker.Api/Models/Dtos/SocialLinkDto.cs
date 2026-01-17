namespace AchievementTracker.Models.Dtos;

public class SocialLinkDto
{
    [System.Text.Json.Serialization.JsonPropertyName("kind")]
    public string Kind { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;
}
