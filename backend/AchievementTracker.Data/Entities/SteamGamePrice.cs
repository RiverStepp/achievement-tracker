namespace AchievementTracker.Data.Entities;

public sealed class SteamGamePrice
{
    public int Id { get; set; }
    public int GameId { get; set; }
    public decimal Price { get; set; }
    public decimal OriginalPrice { get; set; }
    public required string CurrencyCode { get; set; }
    public required string OriginalCurrencyCode { get; set; }
    public DateTime RecordedAt { get; set; }

    #region navigation
    public SteamGame Game { get; set; } = null!;
    #endregion
}

