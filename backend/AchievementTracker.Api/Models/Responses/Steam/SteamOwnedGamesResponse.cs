using System.Text.Json.Serialization;
 
namespace AchievementTracker.Api.Models.Responses.Steam;
 
public sealed class SteamOwnedGamesResponse
{
     [JsonPropertyName("response")]
     public SteamOwnedGamesData? Response { get; set; }
}
 
public sealed class SteamOwnedGamesData
{
     [JsonPropertyName("game_count")]
     public int GameCount { get; set; }
 
     [JsonPropertyName("games")]
     public List<SteamOwnedGame>? Games { get; set; }
}
 
public sealed class SteamOwnedGame
{
     [JsonPropertyName("appid")]
     public uint AppId { get; set; }
 
     [JsonPropertyName("name")]
     public string? Name { get; set; }
 
     [JsonPropertyName("has_community_visible_stats")]
     public bool HasCommunityVisibleStats { get; set; }
 
     [JsonPropertyName("playtime_forever")]
     public int PlaytimeForever { get; set; }
}
