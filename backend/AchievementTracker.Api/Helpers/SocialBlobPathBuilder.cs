namespace AchievementTracker.Api.Helpers;

public static class SocialBlobPathBuilder
{
     public static string BuildDatePartitionedBlobName(DateTime utcNow, string extensionWithDot)
     {
          return $"{utcNow:yyyy/MM/dd}/{Guid.NewGuid():N}{extensionWithDot}";
     }
}
