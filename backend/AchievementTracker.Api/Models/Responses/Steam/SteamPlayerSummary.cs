using AchievementTracker.Api.Models.Enums;
using System.Text.Json.Serialization;

namespace AchievementTracker.Api.Models.Responses.Steam;

public sealed class SteamPlayerSummary
{
     [JsonPropertyName("personaname")]
     public string? PersonaName { get; set; }

     [JsonPropertyName("profileurl")]
     public string? ProfileUrl { get; set; }

     [JsonPropertyName("avatar")]
     public string? Avatar { get; set; }

     [JsonPropertyName("avatarmedium")]
     public string? AvatarMedium { get; set; }

     [JsonPropertyName("avatarfull")]
     public string? AvatarFull { get; set; }

     [JsonPropertyName("communityvisibilitystate")]
     public eCommunityVisibilityState? CommunityVisibilityState { get; set; }
}
