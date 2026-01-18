namespace AchievementTracker.Data.Entities.Common;

public abstract class AuditableEntity
{
     public bool IsActive { get; set; } = true;
     public DateTime CreateDate { get; set; }
     public DateTime UpdateDate { get; set; }
}

