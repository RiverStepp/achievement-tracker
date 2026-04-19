using AchievementTracker.Data.Entities;
using AchievementTracker.Data.Entities.Common;
using Microsoft.EntityFrameworkCore;

namespace AchievementTracker.Data.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
     #region DbSet 
     // Please keep these alphabetical :)
     public DbSet<AppUserPinnedAchievement> AppUserPinnedAchievements => Set<AppUserPinnedAchievement>();
     public DbSet<AppUserSocialLink> AppUserSocialLinks => Set<AppUserSocialLink>();
     public DbSet<AppUser> AppUsers => Set<AppUser>();
     public DbSet<Conversation> Conversations => Set<Conversation>();
     public DbSet<ConversationParticipant> ConversationParticipants => Set<ConversationParticipant>();
     public DbSet<DirectMessage> DirectMessages => Set<DirectMessage>();
     public DbSet<IanaTimeZone> IanaTimeZones => Set<IanaTimeZone>();
     public DbSet<LocationCity> LocationCities => Set<LocationCity>();
     public DbSet<LocationCountry> LocationCountries => Set<LocationCountry>();
     public DbSet<LocationStateRegion> LocationStateRegions => Set<LocationStateRegion>();
     public DbSet<MessageEmbed> MessageEmbeds => Set<MessageEmbed>();
     public DbSet<PronounOption> PronounOptions => Set<PronounOption>();
     public DbSet<Role> Roles => Set<Role>();
     public DbSet<SocialPostAttachment> SocialPostAttachments => Set<SocialPostAttachment>();
     public DbSet<SocialPostComment> SocialPostComments => Set<SocialPostComment>();
     public DbSet<SocialPostReaction> SocialPostReactions => Set<SocialPostReaction>();
     public DbSet<SocialPost> SocialPosts => Set<SocialPost>();

     public DbSet<SteamAchievement> SteamAchievements => Set<SteamAchievement>();
     public DbSet<SteamAchievementStat> SteamAchievementStats => Set<SteamAchievementStat>();
     public DbSet<SteamCategory> SteamCategories => Set<SteamCategory>();
     public DbSet<SteamDeveloper> SteamDevelopers => Set<SteamDeveloper>();
     public DbSet<SteamGameCategory> SteamGameCategories => Set<SteamGameCategory>();
     public DbSet<SteamGameDeveloper> SteamGameDevelopers => Set<SteamGameDeveloper>();
     public DbSet<SteamGameGenre> SteamGameGenres => Set<SteamGameGenre>();
     public DbSet<SteamGameLanguage> SteamGameLanguages => Set<SteamGameLanguage>();
     public DbSet<SteamGamePlatform> SteamGamePlatforms => Set<SteamGamePlatform>();
     public DbSet<SteamGamePrice> SteamGamePrices => Set<SteamGamePrice>();
     public DbSet<SteamGamePublisher> SteamGamePublishers => Set<SteamGamePublisher>();
     public DbSet<SteamGameReview> SteamGameReviews => Set<SteamGameReview>();
     public DbSet<SteamGame> SteamGames => Set<SteamGame>();
     public DbSet<SteamGameTag> SteamGameTags => Set<SteamGameTag>();
     public DbSet<SteamGenre> SteamGenres => Set<SteamGenre>();
     public DbSet<SteamLanguage> SteamLanguages => Set<SteamLanguage>();
     public DbSet<SteamPublisher> SteamPublishers => Set<SteamPublisher>();
     public DbSet<SteamTag> SteamTags => Set<SteamTag>();
     public DbSet<SteamUserAchievement> SteamUserAchievements => Set<SteamUserAchievement>();
     public DbSet<SteamUserGame> SteamUserGames => Set<SteamUserGame>();
     public DbSet<UserAchievementSummary> UserAchievementSummaries => Set<UserAchievementSummary>();
     public DbSet<UserExternalLogin> UserExternalLogins => Set<UserExternalLogin>();
     public DbSet<UserRole> UserRoles => Set<UserRole>();
     public DbSet<UserSteamProfile> UserSteamProfiles => Set<UserSteamProfile>();
     #endregion

     protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
     {
          if (!optionsBuilder.IsConfigured)
          {
               // This fallback allows design-time commands to run if DI has not configured the context.
               optionsBuilder.UseSqlServer("Name=ConnectionStrings:DefaultConnection");
          }
     }

     public override int SaveChanges()
     {
          ApplyAuditStamps();
          return base.SaveChanges();
     }

     public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
     {
          ApplyAuditStamps();
          return base.SaveChangesAsync(cancellationToken);
     }

     private void ApplyAuditStamps()
     {
          var now = DateTime.UtcNow;

          foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
          {
               if (entry.State == EntityState.Added)
               {
                    entry.Entity.CreateDate = now;
                    entry.Entity.UpdateDate = now;
               }
               else if(entry.State == EntityState.Modified)
               {
                    // Prevents me from being dumb and changing the create date 
                    entry.Property(x => x.CreateDate).IsModified = false;

                    entry.Entity.UpdateDate = now;
               } 
          }
     }

     protected override void OnModelCreating(ModelBuilder modelBuilder)
     {
          base.OnModelCreating(modelBuilder);
          modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
     }
}

