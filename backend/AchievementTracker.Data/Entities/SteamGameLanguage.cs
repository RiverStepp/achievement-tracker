namespace AchievementTracker.Data.Entities;

public sealed class SteamGameLanguage
{
    public int GameId { get; set; }
    public int LanguageId { get; set; }
    public bool HasInterface { get; set; }
    public bool HasFullAudio { get; set; }
    public bool HasSubtitles { get; set; }

    #region navigation
    public SteamGame Game { get; set; } = null!;
    public SteamLanguage Language { get; set; } = null!;
    #endregion
}

