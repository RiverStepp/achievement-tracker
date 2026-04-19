namespace AchievementTracker.Api.Models.Results;

public sealed record SetSocialIdentityResult(bool Success, string? ErrorMessage)
{
     public static SetSocialIdentityResult Ok() => new(true, null);

     public static SetSocialIdentityResult Failed(string errorMessage) => new(false, errorMessage);
}
