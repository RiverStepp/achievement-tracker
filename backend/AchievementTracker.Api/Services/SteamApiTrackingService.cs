using System.Collections.Concurrent;
using AchievementTracker.Models.Dtos;
using System.Text.Json;

namespace AchievementTracker.Services;

public class SteamApiTrackingService : ISteamApiTrackingService
{
    private readonly ConcurrentQueue<SteamApiCallDto> _apiCalls = new();
    private readonly ILogger<SteamApiTrackingService> _logger;
    private const int MaxHistorySize = 10000; // Keep last 10k calls in memory

    public SteamApiTrackingService(ILogger<SteamApiTrackingService> logger)
    {
        _logger = logger;
    }

    public Task RecordApiCallAsync(string endpoint, string method, int statusCode, long responseTimeMs,
        Dictionary<string, string>? requestParams = null, string? errorMessage = null)
    {
        try
        {
            var call = new SteamApiCallDto
            {
                Id = _apiCalls.Count + 1,
                Endpoint = endpoint,
                Method = method,
                Timestamp = DateTime.UtcNow,
                StatusCode = statusCode,
                ResponseTimeMs = responseTimeMs,
                RequestParams = requestParams != null ? JsonSerializer.Serialize(requestParams) : null,
                ErrorMessage = errorMessage,
                Success = statusCode >= 200 && statusCode < 400
            };

            _apiCalls.Enqueue(call);

            // Trim queue if it gets too large
            while (_apiCalls.Count > MaxHistorySize)
            {
                _apiCalls.TryDequeue(out _);
            }

            _logger.LogDebug("Recorded Steam API call: {Endpoint} - {StatusCode} - {ResponseTimeMs}ms", 
                endpoint, statusCode, responseTimeMs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording Steam API call");
        }

        return Task.CompletedTask;
    }

    public Task<SteamApiStatsDto> GetStatsAsync()
    {
        var calls = _apiCalls.ToArray();
        var now = DateTime.UtcNow;
        var lastHour = now.AddHours(-1);
        var last24Hours = now.AddHours(-24);

        var stats = new SteamApiStatsDto
        {
            TotalRequests = calls.Length,
            RequestsLastHour = calls.Count(c => c.Timestamp >= lastHour),
            RequestsLast24Hours = calls.Count(c => c.Timestamp >= last24Hours),
            LastRequestTime = calls.OrderByDescending(c => c.Timestamp).FirstOrDefault()?.Timestamp,
            EndpointSummaries = GetEndpointSummaries(calls)
        };

        // Calculate requests per second (based on last minute)
        var lastMinute = now.AddMinutes(-1);
        var recentCalls = calls.Where(c => c.Timestamp >= lastMinute).ToArray();
        stats.RequestsPerSecond = recentCalls.Length > 0 
            ? (int)Math.Ceiling(recentCalls.Length / 60.0) 
            : 0;

        return Task.FromResult(stats);
    }

    public Task<List<SteamApiCallDto>> GetRecentCallsAsync(int limit = 100)
    {
        var calls = _apiCalls
            .OrderByDescending(c => c.Timestamp)
            .Take(limit)
            .ToList();

        return Task.FromResult(calls);
    }

    public Task<List<SteamApiCallSummaryDto>> GetEndpointSummariesAsync()
    {
        var calls = _apiCalls.ToArray();
        var summaries = GetEndpointSummaries(calls);
        return Task.FromResult(summaries);
    }

    public Task ClearHistoryAsync()
    {
        while (_apiCalls.TryDequeue(out _)) { }
        _logger.LogInformation("Cleared Steam API call history");
        return Task.CompletedTask;
    }

    private List<SteamApiCallSummaryDto> GetEndpointSummaries(SteamApiCallDto[] calls)
    {
        return calls
            .GroupBy(c => c.Endpoint)
            .Select(g => new SteamApiCallSummaryDto
            {
                Endpoint = g.Key,
                TotalCalls = g.Count(),
                SuccessfulCalls = g.Count(c => c.Success),
                FailedCalls = g.Count(c => !c.Success),
                AverageResponseTimeMs = g.Any() ? (long)g.Average(c => c.ResponseTimeMs) : 0,
                LastCalled = g.Max(c => c.Timestamp)
            })
            .OrderByDescending(s => s.TotalCalls)
            .ToList();
    }
}
