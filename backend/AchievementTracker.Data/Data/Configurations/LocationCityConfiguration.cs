using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class LocationCityConfiguration : IEntityTypeConfiguration<LocationCity>
{
    public void Configure(EntityTypeBuilder<LocationCity> b)
    {
        b.ToTable("LocationCities");
        b.HasKey(x => x.LocationCityId);

        b.Property(x => x.Name)
            .HasMaxLength(120)
            .IsRequired();

        b.HasIndex(x => new { x.LocationStateRegionId, x.Name }).IsUnique();
    }
}
