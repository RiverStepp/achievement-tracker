namespace AchievementTracker.Models.Dtos;

public class PrivacyDto
{
    [System.Text.Json.Serialization.JsonPropertyName("showStats")]
    public bool ShowStats { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("showActivity")]
    public bool ShowActivity { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("showLinkedAccounts")]
    public bool ShowLinkedAccounts { get; set; }
}
