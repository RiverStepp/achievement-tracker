namespace AchievementTracker.Api.Services.BusinessLogic;

public sealed class UserProfileMediaStorageException : InvalidOperationException
{
    public UserProfileMediaStorageException(string message)
        : base(message)
    {
    }

    public UserProfileMediaStorageException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
