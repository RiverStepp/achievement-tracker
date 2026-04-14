using AchievementTracker.Data.Constants;
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

          b.Property(x => x.Handle)
              .HasMaxLength(15);

          b.Property(x => x.DisplayName)
              .HasMaxLength(20);

          b.Property(x => x.Bio)
              .HasMaxLength(UserSettingsConstraints.MaxBioLength);

          b.Property(x => x.ProfileImageUrl)
              .HasMaxLength(UserSettingsConstraints.MaxProfileMediaUrlLength);

          b.Property(x => x.ProfileImageFileName)
              .HasMaxLength(UserSettingsConstraints.MaxProfileMediaFileNameLength);

          b.Property(x => x.BannerImageUrl)
              .HasMaxLength(UserSettingsConstraints.MaxProfileMediaUrlLength);

          b.Property(x => x.BannerImageFileName)
              .HasMaxLength(UserSettingsConstraints.MaxProfileMediaFileNameLength);

          b.HasOne(x => x.LocationCountry)
              .WithMany()
              .HasForeignKey(x => x.LocationCountryId)
              .OnDelete(DeleteBehavior.Restrict);

          b.HasOne(x => x.LocationStateRegion)
              .WithMany()
              .HasForeignKey(x => x.LocationStateRegionId)
              .OnDelete(DeleteBehavior.Restrict);

          b.HasOne(x => x.LocationCity)
              .WithMany()
              .HasForeignKey(x => x.LocationCityId)
              .OnDelete(DeleteBehavior.Restrict);

          b.HasOne(x => x.IanaTimeZone)
              .WithMany()
              .HasForeignKey(x => x.IanaTimeZoneId)
              .OnDelete(DeleteBehavior.Restrict);

          b.HasOne(x => x.PronounOption)
              .WithMany()
              .HasForeignKey(x => x.PronounOptionId)
              .OnDelete(DeleteBehavior.Restrict);

          b.HasIndex(x => x.Handle)
              .IsUnique()
              .HasFilter("[Handle] IS NOT NULL");

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
