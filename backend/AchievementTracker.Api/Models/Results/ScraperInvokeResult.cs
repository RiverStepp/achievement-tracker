namespace AchievementTracker.Api.Models.Results;

public sealed record ScraperInvokeResult(bool Success, string? Error, string? SteamId);
