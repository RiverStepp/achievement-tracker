using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class SteamTagConfiguration : IEntityTypeConfiguration<SteamTag>
{
    public void Configure(EntityTypeBuilder<SteamTag> b)
    {
        b.ToTable("SteamTags");

        b.HasKey(x => x.Id);

        b.Property(x => x.Name)
            .HasMaxLength(100)
            .IsRequired();

        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.CreateDate).HasDefaultValueSql("SYSUTCDATETIME()");
        b.Property(x => x.UpdateDate).HasDefaultValueSql("SYSUTCDATETIME()");

        b.HasIndex(x => x.Name).IsUnique();
    }
}

