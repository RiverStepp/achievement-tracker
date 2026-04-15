namespace AchievementTracker.Api.Models.Options;

public sealed class UserProfileMediaUploadOptions
{
    public long MaxImageBytes { get; set; } = 10 * 1024 * 1024;

    public string[] AllowedImageMimeTypes { get; set; } = [];

    /// <summary>Maximum width or height allowed when decoding (DoS mitigation).</summary>
    public int MaxDecodeDimension { get; set; } = 8192;

    /// <summary>Square profile output (e.g. 400px, displayed as a circle on the client).</summary>
    public int ProfileOutputSize { get; set; } = 400;

    /// <summary>Banner width (3:1 ratio, similar to Twitter/X header).</summary>
    public int BannerOutputWidth { get; set; } = 1500;

    public int BannerOutputHeight { get; set; } = 500;

    public int JpegQuality { get; set; } = 85;
}
