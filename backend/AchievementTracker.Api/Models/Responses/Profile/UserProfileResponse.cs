namespace AchievementTracker.Api.Models.Responses.Profile;

public sealed record UserProfileResponse(
    ProfileAppUserDto? AppUser,
    IReadOnlyList<ProfileSocialLinkItemDto> VisibleSocialLinks,
    SteamProfileMetadataDto? SteamProfile,
    UserTotalsDto Totals,    PagedResultDto<ProfileGameItemDto> GamesByRecentAchievement,
    PagedResultDto<ProfileAchievementItemDto> RecentAchievements,
    PagedResultDto<ProfileAchievementItemDto> AchievementsByPoints,
    IReadOnlyList<ProfilePinnedAchievementDto> PinnedAchievements,
    PagedResultDto<ProfileLatestActivityItemDto> LatestActivity
);
