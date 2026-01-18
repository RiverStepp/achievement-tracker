using AchievementTracker.Models.Responses;

namespace AchievementTracker.Api.Services.Interfaces;

public interface IAuthService
{
     Task<AuthTokenResponse?> IssueTokensAsync(HttpContext httpContext, string steamId);
     Task<AuthTokenResponse?> RefreshAsync(HttpContext httpContext);
     Task LogoutAsync(HttpContext httpContext);
}
