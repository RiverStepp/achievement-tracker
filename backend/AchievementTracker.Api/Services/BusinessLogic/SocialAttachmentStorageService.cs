using AchievementTracker.Api.Helpers;
using AchievementTracker.Api.Models.Options;
using AchievementTracker.Api.Services.Interfaces;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Options;

namespace AchievementTracker.Api.Services.BusinessLogic;

public sealed class SocialAttachmentStorageService(IOptions<SocialOptions> socialOptions)
     : ISocialAttachmentStorageService
{
     private const string ErrBlobStorageNotConfigured =
          "Social blob storage settings are not configured.";

     private readonly SocialBlobStorageOptions _blob = socialOptions.Value.BlobStorage;

     public async Task<string> UploadImageAsync(Stream content, string contentType, CancellationToken ct = default)
     {
          if (string.IsNullOrWhiteSpace(_blob.ConnectionString)
              || string.IsNullOrWhiteSpace(_blob.ContainerName))
          {
               throw new InvalidOperationException(ErrBlobStorageNotConfigured);
          }

          BlobContainerClient containerClient = new BlobContainerClient(
               _blob.ConnectionString,
               _blob.ContainerName);

          PublicAccessType accessType = _blob.PublicRead ? PublicAccessType.Blob : PublicAccessType.None;
          await containerClient.CreateIfNotExistsAsync(accessType, cancellationToken: ct);

          string extension = MimeTypeFileExtensions.GetExtensionForImageMimeType(contentType);
          string blobName = SocialBlobPathBuilder.BuildDatePartitionedBlobName(
               DateTime.UtcNow,
               extension);

          BlobClient blobClient = containerClient.GetBlobClient(blobName);
          await blobClient.UploadAsync(
               content,
               new BlobUploadOptions
               {
                    HttpHeaders = new BlobHttpHeaders { ContentType = contentType }
               },
               ct);

          return blobClient.Uri.ToString();
     }
}
