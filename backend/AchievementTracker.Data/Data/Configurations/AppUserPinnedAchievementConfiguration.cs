using AchievementTracker.Data.Entities;
using AchievementTracker.Data.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class AppUserPinnedAchievementConfiguration : IEntityTypeConfiguration<AppUserPinnedAchievement>
{
    public void Configure(EntityTypeBuilder<AppUserPinnedAchievement> b)
    {
        b.ToTable("AppUserPinnedAchievements");
        b.HasKey(x => x.AppUserPinnedAchievementId);

        b.Property(x => x.PlatformId)
            .HasConversion<byte>()
            .HasColumnType("tinyint");

        b.Property(x => x.DisplayOrder).IsRequired();

        b.HasOne(x => x.AppUser)
            .WithMany(x => x.PinnedAchievements)
            .HasForeignKey(x => x.AppUserId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasOne(x => x.SteamAchievement)
            .WithMany()
            .HasForeignKey(x => x.SteamAchievementId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasIndex(x => new { x.AppUserId, x.PlatformId, x.SteamAchievementId })
            .IsUnique()
            .HasFilter("[IsActive] = 1");
    }
}
