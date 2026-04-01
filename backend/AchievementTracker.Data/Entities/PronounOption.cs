namespace AchievementTracker.Data.Entities;

public sealed class PronounOption
{
    public int PronounOptionId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string DisplayLabel { get; set; } = string.Empty;
}
