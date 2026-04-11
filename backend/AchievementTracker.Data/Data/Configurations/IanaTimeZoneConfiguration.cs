using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class IanaTimeZoneConfiguration : IEntityTypeConfiguration<IanaTimeZone>
{
    public void Configure(EntityTypeBuilder<IanaTimeZone> b)
    {
        b.ToTable("IanaTimeZones");
        b.HasKey(x => x.IanaTimeZoneId);

        b.Property(x => x.IanaIdentifier)
            .HasMaxLength(100)
            .IsRequired();

        b.Property(x => x.DisplayName)
            .HasMaxLength(200)
            .IsRequired();

        b.HasIndex(x => x.IanaIdentifier).IsUnique();
    }
}
