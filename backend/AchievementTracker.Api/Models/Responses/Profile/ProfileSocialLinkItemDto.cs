using AchievementTracker.Data.Enums;

namespace AchievementTracker.Api.Models.Responses.Profile;

public sealed record ProfileSocialLinkItemDto(eSocialPlatform Platform, string LinkValue);
