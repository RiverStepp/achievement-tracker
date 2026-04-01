using System.Text.Json.Serialization;

namespace AchievementTracker.Api.Models.Responses.Profile;

public sealed record ProfileAppUserDto(
    string? Handle,
    string? DisplayName,
    string? Bio,
    string? Pronouns,
    ProfileUserLocationDto? Location,
    string? TimeZoneDisplayName,
    [property: JsonPropertyName("joinDate")] DateTime? JoinDate);
