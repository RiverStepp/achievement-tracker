using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class SteamAchievementStatConfiguration : IEntityTypeConfiguration<SteamAchievementStat>
{
    public void Configure(EntityTypeBuilder<SteamAchievementStat> b)
    {
        b.ToTable("SteamAchievementStats");

        b.HasKey(x => x.AchievementId);

        b.Property(x => x.AchievementId)
            .ValueGeneratedNever();

        b.Property(x => x.GlobalPercentage)
            .HasColumnType("decimal(5, 2)")
            .IsRequired();

        b.Property(x => x.UpdateDate)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        b.HasOne(x => x.Achievement)
            .WithOne(x => x.Stats)
            .HasForeignKey<SteamAchievementStat>(x => x.AchievementId)
            .OnDelete(DeleteBehavior.NoAction);

        b.ToTable(tb =>
            tb.HasCheckConstraint(
                "CK_SteamAchievementStats_Percentage",
                "[GlobalPercentage] BETWEEN 0 AND 100"
            )
        );
    }
}

