using System.Text.Json.Serialization;

namespace AchievementTracker.Api.Models.Responses.Steam;

public sealed class SteamPlayerSummariesResponse
{
     [JsonPropertyName("response")]
     public SteamPlayerResponse? Response { get; set; }
}