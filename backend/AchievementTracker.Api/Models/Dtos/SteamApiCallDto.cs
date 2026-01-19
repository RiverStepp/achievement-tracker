namespace AchievementTracker.Models.Dtos;

public class SteamApiCallDto
{
    public int Id { get; set; }
    public string Endpoint { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public int StatusCode { get; set; }
    public long ResponseTimeMs { get; set; }
    public string? RequestParams { get; set; }
    public string? ErrorMessage { get; set; }
    public bool Success { get; set; }
}

public class SteamApiCallSummaryDto
{
    public string Endpoint { get; set; } = string.Empty;
    public int TotalCalls { get; set; }
    public int SuccessfulCalls { get; set; }
    public int FailedCalls { get; set; }
    public long AverageResponseTimeMs { get; set; }
    public DateTime? LastCalled { get; set; }
}

public class SteamApiStatsDto
{
    public int TotalRequests { get; set; }
    public int RequestsLastHour { get; set; }
    public int RequestsLast24Hours { get; set; }
    public int RequestsPerSecond { get; set; }
    public List<SteamApiCallSummaryDto> EndpointSummaries { get; set; } = new();
    public DateTime? LastRequestTime { get; set; }
}
