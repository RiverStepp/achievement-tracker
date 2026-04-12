using AchievementTracker.Api.Helpers;
using AchievementTracker.Api.Models.Options;
using AchievementTracker.Api.Services.Interfaces;
using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Options;

namespace AchievementTracker.Api.Services.BusinessLogic;

public sealed class UserProfileMediaStorageService(
    IOptions<UserSettingsOptions> userSettingsOptions,
    IOptions<SocialOptions> socialOptions)
    : IUserProfileMediaStorageService
{
    private const string ErrBlobStorageNotConfigured = "Profile media blob storage settings are not configured.";
    private const string ErrBlobUploadFailed = "Could not store the image. Please try again later.";

    private readonly UserSettingsOptions _settings = userSettingsOptions.Value;
    private readonly SocialOptions _social = socialOptions.Value;

    public async Task<UserProfileMediaUploadResult> UploadProcessedImageAsync(
        Stream content,
        string contentType,
        string extensionWithDot,
        CancellationToken ct = default)
    {
        var blob = _settings.ProfileMediaBlobStorage;
        string connectionString = !string.IsNullOrWhiteSpace(blob.ConnectionString)
            ? blob.ConnectionString
            : _social.BlobStorage.ConnectionString;

        if (string.IsNullOrWhiteSpace(connectionString) || string.IsNullOrWhiteSpace(blob.ContainerName))
            throw new UserProfileMediaStorageException(ErrBlobStorageNotConfigured);

        var containerClient = new BlobContainerClient(connectionString, blob.ContainerName);
        PublicAccessType accessType = blob.PublicRead ? PublicAccessType.Blob : PublicAccessType.None;

        try
        {
            await containerClient.CreateIfNotExistsAsync(accessType, cancellationToken: ct);
        }
        catch (Exception ex) when (ex is RequestFailedException or IOException)
        {
            throw new UserProfileMediaStorageException(ErrBlobUploadFailed, ex);
        }

        string blobName = SocialBlobPathBuilder.BuildDatePartitionedBlobName(DateTime.UtcNow, extensionWithDot);
        BlobClient blobClient = containerClient.GetBlobClient(blobName);

        try
        {
            await blobClient.UploadAsync(
                content,
                new BlobUploadOptions { HttpHeaders = new BlobHttpHeaders { ContentType = contentType } },
                ct);
        }
        catch (Exception ex) when (ex is RequestFailedException or IOException)
        {
            throw new UserProfileMediaStorageException(ErrBlobUploadFailed, ex);
        }

        return new UserProfileMediaUploadResult(blobClient.Uri.ToString(), blobName);
    }

    public async Task DeleteBlobIfExistsAsync(string blobName, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(blobName))
            return;

        var blob = _settings.ProfileMediaBlobStorage;
        string connectionString = !string.IsNullOrWhiteSpace(blob.ConnectionString)
            ? blob.ConnectionString
            : _social.BlobStorage.ConnectionString;

        if (string.IsNullOrWhiteSpace(connectionString) || string.IsNullOrWhiteSpace(blob.ContainerName))
            return;

        try
        {
            var containerClient = new BlobContainerClient(connectionString, blob.ContainerName);
            BlobClient blobClient = containerClient.GetBlobClient(blobName);
            await blobClient.DeleteIfExistsAsync(cancellationToken: ct);
        }
        catch (Exception ex) when (ex is RequestFailedException or IOException)
        {
            throw new UserProfileMediaStorageException(ErrBlobUploadFailed, ex);
        }
    }
}
