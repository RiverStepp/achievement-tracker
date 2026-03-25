namespace AchievementTracker.Api.Models.Options;

public sealed class RedisOptions
{
    public string? ConnectionString { get; init; }
    public string? InstanceName { get; init; }
}
