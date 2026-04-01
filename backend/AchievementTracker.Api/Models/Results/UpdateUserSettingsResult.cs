namespace AchievementTracker.Api.Models.Results;

public sealed class UpdateUserSettingsResult
{
    private UpdateUserSettingsResult(bool success, string? errorMessage)
    {
        Success = success;
        ErrorMessage = errorMessage;
    }

    public bool Success { get; }
    public string? ErrorMessage { get; }

    public static UpdateUserSettingsResult Ok() => new(true, null);

    public static UpdateUserSettingsResult Failed(string message) => new(false, message);
}
