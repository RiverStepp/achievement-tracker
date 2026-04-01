namespace AchievementTracker.Api.Models.Responses.Settings;

public sealed record LookupOptionsBatchDto(
    IReadOnlyList<LocationCountryOptionDto> Countries,
    IReadOnlyList<IanaTimeZoneOptionDto> IanaTimeZones,
    IReadOnlyList<PronounOptionItemDto> PronounOptions);
