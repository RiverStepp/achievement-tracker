namespace AchievementTracker.Api.Models.DTOs.Social;

public sealed record CreateSocialPostRequestDto
{
     public string? Content { get; init; }
     public List<CreateSocialPostAttachmentDto> Attachments { get; init; } = [];
}
