using AchievementTracker.Data.Enums;

namespace AchievementTracker.Api.Services.Interfaces;

public interface ICurrentUser
{
     bool IsAuthenticated { get; }
     int? AppUserId { get; }
     eAuthProvider? AuthProvider { get; }
     string? ProviderUserId { get; }
     string? SteamId { get; }
}
