using AchievementTracker.Data.Constants;

namespace AchievementTracker.Api.Models.Options;

public sealed class UserSettingsOptions
{
    public int MaxBioLength { get; init; } = UserSettingsConstraints.MaxBioLength;
    public int MaxSocialLinkValueLength { get; init; } = UserSettingsConstraints.MaxSocialLinkValueLength;
}
