namespace AchievementTracker.Api.Models.Results;

public sealed record UpdatePinnedDisplayOrderResult(bool Success, string? ErrorMessage)
{
    public static UpdatePinnedDisplayOrderResult Ok() => new(true, null);

    public static UpdatePinnedDisplayOrderResult Failed(string errorMessage) => new(false, errorMessage);
}
