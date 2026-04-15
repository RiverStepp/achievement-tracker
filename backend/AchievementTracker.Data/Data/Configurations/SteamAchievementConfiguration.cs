using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class SteamAchievementConfiguration : IEntityTypeConfiguration<SteamAchievement>
{
    public void Configure(EntityTypeBuilder<SteamAchievement> b)
    {
        b.ToTable("SteamAchievements");

        b.HasKey(x => x.Id);

        b.Property(x => x.GameId)
            .IsRequired();

        b.Property(x => x.SteamApiName)
            .HasMaxLength(255)
            .IsRequired();

        b.Property(x => x.Name)
            .HasMaxLength(255)
            .IsRequired();

        b.Property(x => x.Description)
            .HasMaxLength(2000);

        b.Property(x => x.IconUrl)
            .HasMaxLength(500);

        b.Property(x => x.Points)
            .HasDefaultValue(0);

        b.Property(x => x.IsHidden)
            .HasDefaultValue(false);

        b.Property(x => x.DescriptionSource)
            .HasMaxLength(50);

        b.Property(x => x.IsUnobtainable).HasDefaultValue(false);
        b.Property(x => x.IsBuggy).HasDefaultValue(false);
        b.Property(x => x.IsConditionallyObtainable).HasDefaultValue(false);
        b.Property(x => x.IsMultiplayer).HasDefaultValue(false);
        b.Property(x => x.IsMissable).HasDefaultValue(false);
        b.Property(x => x.IsGrind).HasDefaultValue(false);
        b.Property(x => x.IsRandom).HasDefaultValue(false);
        b.Property(x => x.IsDateSpecific).HasDefaultValue(false);
        b.Property(x => x.IsViral).HasDefaultValue(false);
        b.Property(x => x.IsDLC).HasDefaultValue(false);
        b.Property(x => x.IsWorldRecord).HasDefaultValue(false);

        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.CreateDate).HasDefaultValueSql("SYSUTCDATETIME()");
        b.Property(x => x.UpdateDate).HasDefaultValueSql("SYSUTCDATETIME()");

        b.HasOne(x => x.Game)
            .WithMany(x => x.Achievements)
            .HasForeignKey(x => x.GameId)
            .OnDelete(DeleteBehavior.NoAction);

        b.HasIndex(x => x.GameId);
        b.HasIndex(x => x.IsHidden);

        b.HasIndex(x => new { x.GameId, x.SteamApiName })
            .IsUnique();
    }
}

