using AchievementTracker.Models.Dtos;

namespace AchievementTracker.Services;

public interface ISteamApiTrackingService
{
    Task RecordApiCallAsync(string endpoint, string method, int statusCode, long responseTimeMs, 
        Dictionary<string, string>? requestParams = null, string? errorMessage = null);
    
    Task<SteamApiStatsDto> GetStatsAsync();
    
    Task<List<SteamApiCallDto>> GetRecentCallsAsync(int limit = 100);
    
    Task<List<SteamApiCallSummaryDto>> GetEndpointSummariesAsync();
    
    Task ClearHistoryAsync();
}
