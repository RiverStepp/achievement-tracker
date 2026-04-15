using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class SteamGameConfiguration : IEntityTypeConfiguration<SteamGame>
{
    public void Configure(EntityTypeBuilder<SteamGame> b)
    {
        b.ToTable("SteamGames");

        b.HasKey(x => x.Id);

        b.Property(x => x.SteamAppId)
            .IsRequired();

        b.Property(x => x.Name)
            .HasMaxLength(255)
            .IsRequired();

        b.Property(x => x.ReleaseDate)
            .HasColumnType("date");

        b.Property(x => x.HeaderImageUrl)
            .HasMaxLength(500);

        b.Property(x => x.ShortDescription)
            .HasMaxLength(2000);

        b.Property(x => x.IsUnlisted)
            .HasDefaultValue(false);

        b.Property(x => x.IsRemoved)
            .HasDefaultValue(false);

        b.Property(x => x.Alias)
            .HasMaxLength(255);

        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.CreateDate).HasDefaultValueSql("SYSUTCDATETIME()");
        b.Property(x => x.UpdateDate).HasDefaultValueSql("SYSUTCDATETIME()");

        b.HasIndex(x => x.SteamAppId).IsUnique();
        b.HasIndex(x => x.Name);
    }
}

