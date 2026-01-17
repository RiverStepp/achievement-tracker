namespace AchievementTracker.Models.Dtos;

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
