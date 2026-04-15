namespace AchievementTracker.Data.Entities;

public sealed class SteamAchievementStat
{
    public int AchievementId { get; set; }
    public decimal GlobalPercentage { get; set; }
    public DateTime UpdateDate { get; set; }

    #region navigation
    public SteamAchievement Achievement { get; set; } = null!;
    #endregion
}

