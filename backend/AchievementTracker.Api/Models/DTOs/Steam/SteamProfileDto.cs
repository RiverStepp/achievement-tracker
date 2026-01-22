namespace AchievementTracker.Api.Models.DTOs.Steam;

public sealed record SteamProfileDto(
     string? PersonaName,
     string? ProfileUrl,
     string? AvatarSmallUrl,
     string? AvatarMediumUrl,
     string? AvatarFullUrl,
     bool IsPrivate = true
);

