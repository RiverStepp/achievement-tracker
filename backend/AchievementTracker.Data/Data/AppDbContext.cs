using AchievementTracker.Data.Entities;
using AchievementTracker.Data.Entities.Common;
using Microsoft.EntityFrameworkCore;

namespace AchievementTracker.Data.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
     // Please keep these alphabetical :)
     #region dbsets
     public DbSet<AppUser> AppUsers => Set<AppUser>();
     public DbSet<Role> Roles => Set<Role>();
     public DbSet<SocialPost> SocialPosts => Set<SocialPost>();
     public DbSet<SocialPostAttachment> SocialPostAttachments => Set<SocialPostAttachment>();
     public DbSet<SocialPostComment> SocialPostComments => Set<SocialPostComment>();
     public DbSet<SocialPostReaction> SocialPostReactions => Set<SocialPostReaction>();
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

