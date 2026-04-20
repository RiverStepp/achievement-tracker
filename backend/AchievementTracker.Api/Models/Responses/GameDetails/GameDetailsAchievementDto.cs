using System.Text.Json.Serialization;

namespace AchievementTracker.Api.Models.Responses.GameDetails;

public sealed record GameDetailsAchievementDto(
    int AchievementId,
    string Name,
    string? Description,
    string? IconUrl,
    int Points,
    bool IsHidden,
    bool IsUnobtainable,
    bool IsBuggy,
    bool IsConditionallyObtainable,
    bool IsMultiplayer,
    bool IsMissable,
    bool IsGrind,
    bool IsRandom,
    bool IsDateSpecific,
    bool IsViral,
    bool IsDLC,
    bool IsWorldRecord,
    decimal? GlobalPercentage,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    bool? IsUnlocked);
