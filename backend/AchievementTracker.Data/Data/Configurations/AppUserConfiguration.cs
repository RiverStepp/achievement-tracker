using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class AppUserConfiguration: IEntityTypeConfiguration<AppUser>
{
     public void Configure(EntityTypeBuilder<AppUser> b)
     {
          b.HasKey(x => x.AppUserId);

          b.Property(x => x.PublicId)
              .HasDefaultValueSql("NEWSEQUENTIALID()")
              .ValueGeneratedOnAdd();

          b.HasIndex(x => x.PublicId).IsUnique();

          b.Property(x => x.IsActive).HasDefaultValue(true);
          b.Property(x => x.CreateDate).HasDefaultValueSql("SYSUTCDATETIME()");
          b.Property(x => x.UpdateDate).HasDefaultValueSql("SYSUTCDATETIME()");

          b.HasMany(x => x.ExternalLogins)
              .WithOne(x => x.AppUser)
              .HasForeignKey(x => x.AppUserId)
              .OnDelete(DeleteBehavior.Cascade);

          b.HasMany(x => x.UserRoles)
              .WithOne(x => x.AppUser)
              .HasForeignKey(x => x.AppUserId)
              .OnDelete(DeleteBehavior.Cascade);

          b.HasMany(x => x.SocialPosts)
              .WithOne(x => x.AppUser)
              .HasForeignKey(x => x.AuthorAppUserId)
              .OnDelete(DeleteBehavior.Restrict);
     }
}
