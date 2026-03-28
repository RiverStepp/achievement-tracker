namespace AchievementTracker.Api.Services.BusinessLogic;

public sealed class SocialIdentityRequiredException(string message) : InvalidOperationException(message);
