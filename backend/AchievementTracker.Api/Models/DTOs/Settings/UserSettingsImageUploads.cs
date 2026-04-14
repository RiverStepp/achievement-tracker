namespace AchievementTracker.Api.Models.DTOs.Settings;

/// <summary>Multipart image payloads; service disposes after <see cref="AchievementTracker.Api.Services.Interfaces.IUserSettingsService.UpdateSettingsAsync"/> completes.</summary>
public sealed class UserSettingsImageUploads : IAsyncDisposable
{
    public MemoryStream? Profile { get; init; }

    public MemoryStream? Banner { get; init; }

    public async ValueTask DisposeAsync()
    {
        if (Profile != null)
            await Profile.DisposeAsync();
        if (Banner != null)
            await Banner.DisposeAsync();
    }
}
