namespace AchievementTracker.Api.Models.DTOs.Steam;

public sealed record SteamRawResponseDto(
     int StatusCode,
     string? ReasonPhrase,
     string? Body,
     string ContentType
);
