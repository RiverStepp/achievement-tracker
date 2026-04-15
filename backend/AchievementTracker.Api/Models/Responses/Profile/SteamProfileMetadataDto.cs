namespace AchievementTracker.Api.Models.Responses.Profile;

public sealed record SteamProfileMetadataDto(
    string? ProfileUrl,
    string? AvatarSmallUrl,
    DateTime? LastCheckedDate,
    DateTime? LastSyncedDate,
    bool IsPrivate
);
