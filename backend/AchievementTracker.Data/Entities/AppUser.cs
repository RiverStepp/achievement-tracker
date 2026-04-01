using AchievementTracker.Data.Entities.Common;

namespace AchievementTracker.Data.Entities;

public sealed class AppUser: AuditableEntity
{
     public int AppUserId { get; set; }
     public Guid PublicId { get; set; }
     public string? Handle { get; set; }
     public string? DisplayName { get; set; }
     public string? Bio { get; set; }
     public int? LocationCountryId { get; set; }
     public int? LocationStateRegionId { get; set; }
     public int? LocationCityId { get; set; }
     public int? IanaTimeZoneId { get; set; }
     public int? PronounOptionId { get; set; }
     public bool IsListedOnLeaderboards { get; set; }
     public DateTime? LastLoginDate { get; set; }

     #region navigation
     public List<UserExternalLogin> ExternalLogins { get; set; } = [];
     public List<AppUserPinnedAchievement> PinnedAchievements { get; set; } = [];
     public List<SocialPost> SocialPosts { get; set; } = [];
     public List<UserRole> UserRoles { get; set; } = [];
     public List<AppUserSocialLink> SocialLinks { get; set; } = [];
     public LocationCountry? LocationCountry { get; set; }
     public LocationStateRegion? LocationStateRegion { get; set; }
     public LocationCity? LocationCity { get; set; }
     public IanaTimeZone? IanaTimeZone { get; set; }
     public PronounOption? PronounOption { get; set; }
     #endregion
}

