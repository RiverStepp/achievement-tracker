using AchievementTracker.Data.Entities.Common;

namespace AchievementTracker.Data.Entities;

public sealed class SteamGame: AuditableEntity
{
    public int Id { get; set; }
    public int SteamAppId { get; set; }
    public required string Name { get; set; }
    public DateTime? ReleaseDate { get; set; }
    public string? HeaderImageUrl { get; set; }
    public string? ShortDescription { get; set; }
    public bool IsUnlisted { get; set; }
    public bool IsRemoved { get; set; }
    public string? Alias { get; set; }

    #region navigation
    public List<SteamGamePlatform> Platforms { get; set; } = [];
    public List<SteamGameGenre> GameGenres { get; set; } = [];
    public List<SteamGameCategory> GameCategories { get; set; } = [];
    public List<SteamGameTag> GameTags { get; set; } = [];
    public List<SteamGameLanguage> GameLanguages { get; set; } = [];
    public List<SteamGameDeveloper> GameDevelopers { get; set; } = [];
    public List<SteamGamePublisher> GamePublishers { get; set; } = [];
    public List<SteamAchievement> Achievements { get; set; } = [];
    public List<SteamUserGame> UserGames { get; set; } = [];
    public List<SteamGamePrice> Prices { get; set; } = [];
    public List<SteamGameReview> Reviews { get; set; } = [];
    #endregion
}

