namespace AchievementTracker.Api.Services.Interfaces;

public sealed record UserProfileMediaUploadResult(string Url, string BlobName);

public interface IUserProfileMediaStorageService
{
    Task<UserProfileMediaUploadResult> UploadProcessedImageAsync(
        Stream content,
        string contentType,
        string extensionWithDot,
        CancellationToken ct = default);

    Task DeleteBlobIfExistsAsync(string blobName, CancellationToken ct = default);
}
