using System.Text.Json.Serialization;
 
namespace AchievementTracker.Api.Models.Responses.Steam;
 
public sealed class SteamPlayerAchievementsResponse
{
     [JsonPropertyName("playerstats")]
     public SteamPlayerStats? PlayerStats { get; set; }
}
 
public sealed class SteamPlayerStats
{
     [JsonPropertyName("steamID")]
     public string? SteamId { get; set; }
 
     [JsonPropertyName("gameName")]
     public string? GameName { get; set; }
 
     [JsonPropertyName("achievements")]
     public List<SteamAchievementStat>? Achievements { get; set; }
 
     [JsonPropertyName("success")]
     public bool Success { get; set; }
}
 
public sealed class SteamAchievementStat
{
     [JsonPropertyName("apiname")]
     public string? ApiName { get; set; }
 
     [JsonPropertyName("achieved")]
     public int Achieved { get; set; }
 
     [JsonPropertyName("unlocktime")]
     public long UnlockTime { get; set; }
}
