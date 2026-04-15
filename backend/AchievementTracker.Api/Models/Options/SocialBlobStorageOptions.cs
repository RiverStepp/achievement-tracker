namespace AchievementTracker.Api.Models.Options;

public sealed class SocialBlobStorageOptions
{
     public string ConnectionString { get; set; } = string.Empty;

     public string ContainerName { get; set; } = string.Empty;
     public bool PublicRead { get; set; } = true;
}
