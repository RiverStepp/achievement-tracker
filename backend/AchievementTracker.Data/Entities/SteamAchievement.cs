using AchievementTracker.Data.Entities.Common;

namespace AchievementTracker.Data.Entities;

public sealed class SteamAchievement: AuditableEntity
{
    public int Id { get; set; }
    public int GameId { get; set; }
    public required string SteamApiName { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string? IconUrl { get; set; }
    public int Points { get; set; }
    public bool IsHidden { get; set; }
    public string? DescriptionSource { get; set; }
    public bool IsUnobtainable { get; set; }
    public bool IsBuggy { get; set; }
    public bool IsConditionallyObtainable { get; set; }
    public bool IsMultiplayer { get; set; }
    public bool IsMissable { get; set; }
    public bool IsGrind { get; set; }
    public bool IsRandom { get; set; }
    public bool IsDateSpecific { get; set; }
    public bool IsViral { get; set; }
    public bool IsDLC { get; set; }
    public bool IsWorldRecord { get; set; }

    #region navigation
    public SteamGame Game { get; set; } = null!;
    public List<SteamUserAchievement> UserAchievements { get; set; } = [];
    public SteamAchievementStat? Stats { get; set; }
    #endregion
}

