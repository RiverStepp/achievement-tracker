namespace AchievementTracker.Data.Entities;

public sealed class SteamGameCategory
{
    public int GameId { get; set; }
    public int CategoryId { get; set; }

    #region navigation
    public SteamGame Game { get; set; } = null!;
    public SteamCategory Category { get; set; } = null!;
    #endregion
}

