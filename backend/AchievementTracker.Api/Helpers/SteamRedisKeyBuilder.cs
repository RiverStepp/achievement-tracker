namespace AchievementTracker.Api.Helpers;
public static class SteamRedisKeyBuilder
{
     public static string Build(string prefix, string segment, string value)
          => $"{prefix}:{segment}:{value}";
}
