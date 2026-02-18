using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class UserSteamProfileConfiguration : IEntityTypeConfiguration<UserSteamProfile>
{
     public void Configure(EntityTypeBuilder<UserSteamProfile> b)
     {
          b.ToTable("SteamProfiles");

          b.HasKey(x => x.SteamId);
          b.Property(x => x.SteamId).ValueGeneratedNever();

          b.Property(x => x.IsActive).HasDefaultValue(true);
          b.Property(x => x.CreateDate).HasDefaultValueSql("SYSUTCDATETIME()");
          b.Property(x => x.UpdateDate).HasDefaultValueSql("SYSUTCDATETIME()");

          b.Property(x => x.PersonaName).HasMaxLength(64);
          b.Property(x => x.ProfileUrl).HasMaxLength(256);
          b.Property(x => x.AvatarSmallUrl).HasMaxLength(256);
          b.Property(x => x.AvatarMediumUrl).HasMaxLength(256);
          b.Property(x => x.AvatarFullUrl).HasMaxLength(256);

          b.HasIndex(x => x.UserExternalLoginId)
              .IsUnique()
              .HasFilter("[UserExternalLoginId] IS NOT NULL");
     }
}
