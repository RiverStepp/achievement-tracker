namespace AchievementTracker.Data.Entities;

public sealed class SteamGameReview
{
    public int Id { get; set; }
    public int GameId { get; set; }
    public int SteamRating { get; set; }
    public int? MetacriticScore { get; set; }
    public int Recommendations { get; set; }
    public DateTime RecordedAt { get; set; }

    #region navigation
    public SteamGame Game { get; set; } = null!;
    #endregion
}

