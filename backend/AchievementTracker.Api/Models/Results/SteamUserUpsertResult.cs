namespace AchievementTracker.Api.Models.Results;

public sealed record SteamUserUpsertResult(int AppUserId, bool IsNewUser);
