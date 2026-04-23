namespace AchievementTracker.Api.Models.Results;

public sealed record UnpinAchievementResult(bool Success, string? ErrorMessage)
{
    public static UnpinAchievementResult Ok() => new(true, null);

    public static UnpinAchievementResult Failed(string errorMessage) => new(false, errorMessage);
}
