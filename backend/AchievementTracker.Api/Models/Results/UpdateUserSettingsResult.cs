namespace AchievementTracker.Api.Models.Results;

public sealed class UpdateUserSettingsResult
{
    private UpdateUserSettingsResult(bool success, string? errorMessage, UpdateUserSettingsFailureKind? failureKind)
    {
        Success = success;
        ErrorMessage = errorMessage;
        FailureKind = failureKind;
    }

    public bool Success { get; }
    public string? ErrorMessage { get; }
    public UpdateUserSettingsFailureKind? FailureKind { get; }

    public static UpdateUserSettingsResult Ok() => new(true, null, null);

    public static UpdateUserSettingsResult ValidationFailed(string message) =>
        new(false, message, UpdateUserSettingsFailureKind.Validation);

    public static UpdateUserSettingsResult NotFound(string message) =>
        new(false, message, UpdateUserSettingsFailureKind.NotFound);

    public static UpdateUserSettingsResult Conflict(string message) =>
        new(false, message, UpdateUserSettingsFailureKind.Conflict);
}
