namespace AchievementTracker.Api.Services.Interfaces;

public interface ISocialAttachmentStorageService
{
     Task<string> UploadImageAsync(Stream content, string contentType, CancellationToken ct = default);
}
