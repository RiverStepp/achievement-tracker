namespace AchievementTracker.Api.Services.Interfaces;

public interface IRefreshTokenStore
{
     Task IssueAsync(HttpContext httpContext, string steamId);
     Task<string?> RotateAsync(HttpContext httpContext);
     Task RevokeAsync(HttpContext httpContext);
}