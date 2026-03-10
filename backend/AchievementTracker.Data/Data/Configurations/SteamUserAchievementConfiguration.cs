using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class SteamUserAchievementConfiguration : IEntityTypeConfiguration<SteamUserAchievement>
{
    public void Configure(EntityTypeBuilder<SteamUserAchievement> b)
    {
        b.ToTable("SteamUserAchievements");

        b.HasKey(x => x.Id);

        b.Property(x => x.SteamId)
            .IsRequired();

        b.Property(x => x.AchievementId)
            .IsRequired();

        b.Property(x => x.UnlockedAt)
            .IsRequired();

        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.CreateDate).HasDefaultValueSql("SYSUTCDATETIME()");
        b.Property(x => x.UpdateDate).HasDefaultValueSql("SYSUTCDATETIME()");

        b.HasOne(x => x.UserSteamProfile)
            .WithMany()
            .HasForeignKey(x => x.SteamId)
            .OnDelete(DeleteBehavior.NoAction);

        b.HasOne(x => x.Achievement)
            .WithMany(x => x.UserAchievements)
            .HasForeignKey(x => x.AchievementId)
            .OnDelete(DeleteBehavior.NoAction);

        b.HasIndex(x => new { x.SteamId, x.UnlockedAt })
            .IsDescending(false, true);

        b.HasIndex(x => x.AchievementId);

        b.HasIndex(x => new { x.SteamId, x.AchievementId })
            .IsUnique();
    }
}

