using AchievementTracker.Api.Models.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;

namespace AchievementTracker.Api.Helpers;

public static class UserProfileImageProcessor
{
    public static async Task<ProcessedProfileImage> ProcessProfileSquareAsync(
        Stream input,
        UserProfileMediaUploadOptions options,
        CancellationToken ct)
    {
        using var image = await Image.LoadAsync(input, ct);
        if (image.Width > options.MaxDecodeDimension || image.Height > options.MaxDecodeDimension)
            throw new ArgumentException("Image dimensions exceed the maximum allowed.");

        image.Mutate(x =>
        {
            x.AutoOrient();
            x.Resize(
                new ResizeOptions
                {
                    Size = new Size(options.ProfileOutputSize, options.ProfileOutputSize),
                    Mode = ResizeMode.Crop,
                    Position = AnchorPositionMode.Center
                });
        });

        var ms = new MemoryStream();
        await image.SaveAsJpegAsync(ms, new JpegEncoder { Quality = options.JpegQuality }, ct);
        ms.Position = 0;
        return new ProcessedProfileImage(ms, "image/jpeg", ".jpg");
    }

    public static async Task<ProcessedProfileImage> ProcessBannerAsync(
        Stream input,
        UserProfileMediaUploadOptions options,
        CancellationToken ct)
    {
        using var image = await Image.LoadAsync(input, ct);
        if (image.Width > options.MaxDecodeDimension || image.Height > options.MaxDecodeDimension)
            throw new ArgumentException("Image dimensions exceed the maximum allowed.");

        image.Mutate(x =>
        {
            x.AutoOrient();
            x.Resize(
                new ResizeOptions
                {
                    Size = new Size(options.BannerOutputWidth, options.BannerOutputHeight),
                    Mode = ResizeMode.Crop,
                    Position = AnchorPositionMode.Center
                });
        });

        var ms = new MemoryStream();
        await image.SaveAsJpegAsync(ms, new JpegEncoder { Quality = options.JpegQuality }, ct);
        ms.Position = 0;
        return new ProcessedProfileImage(ms, "image/jpeg", ".jpg");
    }
}

public sealed class ProcessedProfileImage : IAsyncDisposable
{
    public ProcessedProfileImage(MemoryStream stream, string contentType, string extensionWithDot)
    {
        Stream = stream;
        ContentType = contentType;
        ExtensionWithDot = extensionWithDot;
    }

    public MemoryStream Stream { get; }
    public string ContentType { get; }
    public string ExtensionWithDot { get; }

    public ValueTask DisposeAsync() => Stream.DisposeAsync();
}
