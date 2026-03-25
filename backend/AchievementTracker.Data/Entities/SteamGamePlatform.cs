using AchievementTracker.Data.Enums;

namespace AchievementTracker.Data.Entities;

public sealed class SteamGamePlatform
{
    public int GameId { get; set; }
    public ePlatform Platform { get; set; }

    #region navigation
    public SteamGame Game { get; set; } = null!;
    #endregion
}

