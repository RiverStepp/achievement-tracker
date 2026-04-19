namespace AchievementTracker.Data.Entities;

public sealed class SteamGamePublisher
{
    public int GameId { get; set; }
    public int PublisherId { get; set; }

    #region navigation
    public SteamGame Game { get; set; } = null!;
    public SteamPublisher Publisher { get; set; } = null!;
    #endregion
}

