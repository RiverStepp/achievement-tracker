namespace AchievementTracker.Api.Models.Results;

public sealed record PinAchievementResult(bool Success, string? ErrorMessage)
{
    public static PinAchievementResult Ok() => new(true, null);

    public static PinAchievementResult Failed(string errorMessage) => new(false, errorMessage);
}
