using AchievementTracker.Data.Enums;

namespace AchievementTracker.Api.Models.DTOs.Social;

public sealed record SocialPostAttachmentDto
{
     public eAttachmentType AttachmentType { get; init; }
     public required string Url { get; init; }
     public string? Caption { get; init; }
     public short DisplayOrder { get; init; }
}
