namespace AchievementTracker.Api.Models.Responses.Profile;

public sealed record UserProfileResponse(
    SteamProfileMetadataDto? SteamProfile,
    UserTotalsDto Totals,
    PagedResultDto<ProfileGameItemDto> GamesByRecentAchievement,
    PagedResultDto<ProfileAchievementItemDto> RecentAchievements,
    PagedResultDto<ProfileAchievementItemDto> AchievementsByPoints
);
