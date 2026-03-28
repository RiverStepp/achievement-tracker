namespace AchievementTracker.Api.Models.Options;

public sealed class SocialUploadOptions
{
     public long MaxImageBytes { get; set; } = 10 * 1024 * 1024;
     public string[] AllowedImageMimeTypes { get; set; } = [];
}
