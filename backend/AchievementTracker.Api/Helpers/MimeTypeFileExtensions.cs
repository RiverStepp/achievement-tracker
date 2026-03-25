namespace AchievementTracker.Api.Helpers;

public static class MimeTypeFileExtensions
{
     public static string GetExtensionForImageMimeType(string mimeType)
     {
          return mimeType.ToLowerInvariant() switch
          {
               "image/jpeg" => ".jpg",
               "image/png" => ".png",
               "image/gif" => ".gif",
               "image/webp" => ".webp",
               _ => ".bin"
          };
     }
}
