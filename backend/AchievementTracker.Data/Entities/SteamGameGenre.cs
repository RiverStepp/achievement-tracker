namespace AchievementTracker.Data.Entities;

public sealed class SteamGameGenre
{
    public int GameId { get; set; }
    public int GenreId { get; set; }

    #region navigation
    public SteamGame Game { get; set; } = null!;
    public SteamGenre Genre { get; set; } = null!;
    #endregion
}

