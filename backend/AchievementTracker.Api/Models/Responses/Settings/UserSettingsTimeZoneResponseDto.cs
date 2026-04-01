namespace AchievementTracker.Api.Models.Responses.Settings;

public sealed record UserSettingsTimeZoneResponseDto(int IanaTimeZoneId, string IanaIdentifier, string DisplayName);
