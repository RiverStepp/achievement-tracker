using AchievementTracker.Models.Responses;
using Microsoft.AspNetCore.Http;

namespace AchievementTracker.Services;

public interface IAuthService
{
     Task<AuthTokenResponse?> IssueTokensAsync(HttpContext httpContext, string steamId);
     Task<AuthTokenResponse?> RefreshAsync(HttpContext httpContext);
     Task LogoutAsync(HttpContext httpContext);
}
