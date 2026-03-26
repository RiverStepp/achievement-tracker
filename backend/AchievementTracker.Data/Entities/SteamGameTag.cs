namespace AchievementTracker.Data.Entities;

public sealed class SteamGameTag
{
    public int GameId { get; set; }
    public int TagId { get; set; }

    #region navigation
    public SteamGame Game { get; set; } = null!;
    public SteamTag Tag { get; set; } = null!;
    #endregion
}

