using System.Text.Json.Serialization;

namespace AchievementTracker.Api.Models.Responses.GameDetails;

public sealed record GameDetailsResponse(
    bool IsAuthenticated,
    string GameName,
    string? HeaderImageUrl,
    int SteamAppId,
    DateTime? ReleaseDate,
    string? ShortDescription,
    bool IsRemoved,
    bool IsUnlisted,
    int TotalAvailablePoints,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    GameDetailsAuthenticatedProgressDto? AuthenticatedProgress,
    IReadOnlyList<GameDetailsAchievementDto> Achievements);
