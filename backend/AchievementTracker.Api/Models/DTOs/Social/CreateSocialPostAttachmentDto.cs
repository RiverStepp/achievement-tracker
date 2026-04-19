using AchievementTracker.Data.Enums;

namespace AchievementTracker.Api.Models.DTOs.Social;

public sealed record CreateSocialPostAttachmentDto
{
     public eAttachmentType AttachmentType { get; init; }
     public required string Url { get; init; }
     public string? Caption { get; init; }
}
