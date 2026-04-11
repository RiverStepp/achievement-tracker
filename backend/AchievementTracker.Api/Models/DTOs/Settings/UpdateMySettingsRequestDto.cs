namespace AchievementTracker.Api.Models.DTOs.Settings;

public sealed record UpdateMySettingsRequestDto
{
    public string? DisplayName { get; init; }
    public string? Handle { get; init; }
    public string? Bio { get; init; }
    public UserLocationSettingDto? Location { get; init; }
    public bool UnsetLocation { get; init; }
    public int? IanaTimeZoneId { get; init; }
    public bool UnsetTimeZone { get; init; }
    public int? PronounOptionId { get; init; }
    public bool UnsetPronouns { get; init; }
    public IReadOnlyList<UserSocialLinkSettingDto>? SocialLinks { get; init; }
}
