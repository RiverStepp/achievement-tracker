namespace AchievementTracker.Api.Models.Options;

/// <summary>
/// Bound from the "Social" configuration section (appsettings + Key Vault overrides).
/// </summary>
public sealed class SocialOptions
{
     public int DefaultFeedPageSize { get; set; } = 20;
     public int MaxFeedPageSize { get; set; } = 100;
     public int MaxRefreshIntervalSeconds { get; set; } = 3600;
     public int MaxAttachmentCount { get; set; } = 10;
     public int MaxHandleLength { get; set; } = 15;
     public int MaxDisplayNameLength { get; set; } = 20;
     public int MaxContentLength { get; set; } = 4000;
     public int MaxAttachmentUrlLength { get; set; } = 2048;

     public SocialBlobStorageOptions BlobStorage { get; set; } = new();
     public SocialUploadOptions Upload { get; set; } = new();
}

public sealed class SocialBlobStorageOptions
{
     /// <summary>
     /// Populated from Key Vault secret Social--BlobStorage--ConnectionString (not appsettings).
     /// </summary>
     public string ConnectionString { get; set; } = string.Empty;

     public string ContainerName { get; set; } = string.Empty;
     public bool PublicRead { get; set; } = true;
}

public sealed class SocialUploadOptions
{
     public long MaxImageBytes { get; set; } = 10 * 1024 * 1024;
     public string[] AllowedImageMimeTypes { get; set; } = [];
}
