using Microsoft.AspNetCore.Http;

namespace AchievementTracker.Api.Models.DTOs.Social;

public sealed record UploadSocialImageRequestDto
{
     public required IFormFile File { get; init; }
}
