namespace AchievementTracker.Data.Enums;

public enum eNotificationType : short
{
     DirectMessage = 1,
     Like = 2
     // An admin-triggered event notification for a time-sensitive or unpredictable achievement (like annual in-game events)
     EventAchievement = 3,
     // A scheduled notification for a date-specific achievement (like an achievement only obtainable on a particular date)
     ScheduledAchievement = 4
}
