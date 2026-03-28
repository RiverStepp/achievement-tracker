namespace AchievementTracker.Api.Helpers;

public static class SocialPageTokenParser
{
     public static string Encode(DateTime createDateUtc, int id)
     {
          return $"{createDateUtc.Ticks}:{id}";
     }

     public static bool TryParse(string? pageToken, out DateTime createDateUtc, out int id)
     {
          createDateUtc = default;
          id = default;
          if (string.IsNullOrWhiteSpace(pageToken))
               return false;

          string t = pageToken.Trim();
          string[] parts = t.Split(':', StringSplitOptions.RemoveEmptyEntries);
          if (parts.Length != 2)
               return false;

          if (!long.TryParse(parts[0], out long ticks) || !int.TryParse(parts[1], out id))
               return false;

          createDateUtc = new DateTime(ticks, DateTimeKind.Utc);
          return true;
     }

     public static void RequireValidOrNull(string? pageToken, string paramName = "pageToken")
     {
          if (pageToken is null || pageToken.Length == 0)
               return;

          if (string.IsNullOrWhiteSpace(pageToken))
               throw new ArgumentException("Invalid page token.", paramName);

          if (!TryParse(pageToken, out _, out _))
               throw new ArgumentException("Invalid page token.", paramName);
     }
}
