using System.Text.Json.Serialization;

namespace AchievementTracker.Api.Models.Responses.Steam;

public sealed class SteamPlayerResponse
{
     [JsonPropertyName("players")]
     public List<SteamPlayerSummary>? Players { get; set; }
}
