using AchievementTracker.Data.Enums;
 
namespace AchievementTracker.Data.Entities;
 
public sealed class MessageEmbed
{
     public long MessageEmbedId { get; set; }
     public long DirectMessageId { get; set; }
     public eEmbedType EmbedType { get; set; }
     public string Url { get; set; } = string.Empty;
     public string? Title { get; set; }
     public string? Description { get; set; }
     public string? ThumbnailUrl { get; set; }
 
     #region navigation
     public DirectMessage DirectMessage { get; set; } = null!;
     #endregion
}
