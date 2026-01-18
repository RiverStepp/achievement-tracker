using AchievementTracker.Data.Entities.Common;

namespace AchievementTracker.Data.Entities;

public sealed class UserSteamProfile: AuditableEntity
{
     public long SteamId { get; set; }
     public int? UserExternalLoginId { get; set; }


     // TODO
     // THERE IS A SLIM CHANCE THAT STEAM WILL FAIL TO RETRIEVE THIS DATA WHEN WE CREATE A PROFILE
     // If it fails on account creation, we should still allow the user to create an account 
     // Later on we should add a resync button so that IF it fails we can just retrieve the data some other time
     public string? PersonaName { get; set; }
     public string? ProfileUrl { get; set; }
     public string? AvatarSmallUrl { get; set; }
     public string? AvatarMediumUrl { get; set; }
     public string? AvatarFullUrl { get; set; }
     public bool IsPrivate { get; set; }
     public DateTime? LastCheckedDate { get; set; }
     public DateTime? LastSyncedDate { get; set; }

     #region navigation
     public UserExternalLogin? ExternalLogin { get; set; }
     #endregion
}
