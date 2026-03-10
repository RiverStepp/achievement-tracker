namespace AchievementTracker.Data.Entities;

public sealed class SteamGameDeveloper
{
    public int GameId { get; set; }
    public int DeveloperId { get; set; }

    #region navigation
    public SteamGame Game { get; set; } = null!;
    public SteamDeveloper Developer { get; set; } = null!;
    #endregion
}

