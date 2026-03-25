using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class SteamDeveloperConfiguration : IEntityTypeConfiguration<SteamDeveloper>
{
    public void Configure(EntityTypeBuilder<SteamDeveloper> b)
    {
        b.ToTable("SteamDevelopers");

        b.HasKey(x => x.Id);

        b.Property(x => x.Name)
            .HasMaxLength(255)
            .IsRequired();

        b.Property(x => x.PageUrl)
            .HasMaxLength(500);

        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.CreateDate).HasDefaultValueSql("SYSUTCDATETIME()");
        b.Property(x => x.UpdateDate).HasDefaultValueSql("SYSUTCDATETIME()");

        b.HasIndex(x => x.Name).IsUnique();
    }
}

