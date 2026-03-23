using AchievementTracker.Data.Entities.Common;
 
namespace AchievementTracker.Data.Entities;
 
public sealed class UserAchievementSummary : AuditableEntity
{
     public int AppUserId { get; set; }
     public int TotalAchievementsUnlocked { get; set; }
     public int TotalGamesTracked { get; set; }
     public int PerfectGamesCount { get; set; }
     public DateTime? LastSyncedDate { get; set; }
 
     #region navigation
     public AppUser AppUser { get; set; } = null!;
     #endregion
}
