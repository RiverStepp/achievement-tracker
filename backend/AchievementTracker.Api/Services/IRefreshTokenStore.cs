using Microsoft.AspNetCore.Http;

namespace AchievementTracker.Services;

public interface IRefreshTokenStore
{
     Task IssueAsync(HttpContext httpContext, string steamId);
     Task<string?> RotateAsync(HttpContext httpContext);
     Task RevokeAsync(HttpContext httpContext);
}