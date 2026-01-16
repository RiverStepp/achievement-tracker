using AchievementTracker.Data.Entities;
using AchievementTracker.Data.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class UserExternalLoginConfiguration: IEntityTypeConfiguration<UserExternalLogin>
{
     public void Configure(EntityTypeBuilder<UserExternalLogin> b)
     {
          b.HasKey(x => x.UserExternalLoginId);

          b.Property(x => x.IsActive).HasDefaultValue(true);
          b.Property(x => x.CreateDate).HasDefaultValueSql("SYSUTCDATETIME()");
          b.Property(x => x.UpdateDate).HasDefaultValueSql("SYSUTCDATETIME()");

          b.Property(x => x.AuthProvider)
              .HasConversion<short>()
              .HasColumnType("smallint")
              .IsRequired();

          b.Property(x => x.ProviderUserId)
              .HasMaxLength(64)
              .IsRequired();

          b.HasIndex(x => new { x.AuthProvider, x.ProviderUserId }).IsUnique();

          b.HasIndex(x => new { x.AppUserId, x.AuthProvider }).IsUnique();

          b.HasOne(x => x.AppUser)
              .WithMany(x => x.ExternalLogins)
              .HasForeignKey(x => x.AppUserId)
              .OnDelete(DeleteBehavior.Cascade);

          b.HasOne(x => x.SteamProfile)
              .WithOne(x => x.ExternalLogin)
              .HasForeignKey<UserSteamProfile>(x => x.UserExternalLoginId)
              .OnDelete(DeleteBehavior.Cascade);

          // Forces a valid auth provider
          string enumValues = string.Join(", ",
              Enum.GetValues<eAuthProvider>()
                  .Select(v => (short)v)
          );

          b.ToTable(tb =>
              tb.HasCheckConstraint("CK_UserExternalLogins_AuthProvider", $"[AuthProvider] IN ({enumValues})")
          );
     }
}
