using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class SteamPublisherConfiguration : IEntityTypeConfiguration<SteamPublisher>
{
    public void Configure(EntityTypeBuilder<SteamPublisher> b)
    {
        b.ToTable("SteamPublishers");

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

