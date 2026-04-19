using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class LocationStateRegionConfiguration : IEntityTypeConfiguration<LocationStateRegion>
{
    public void Configure(EntityTypeBuilder<LocationStateRegion> b)
    {
        b.ToTable("LocationStateRegions");
        b.HasKey(x => x.LocationStateRegionId);

        b.Property(x => x.Code)
            .HasMaxLength(16)
            .IsRequired();

        b.Property(x => x.Name)
            .HasMaxLength(120)
            .IsRequired();

        b.HasIndex(x => new { x.LocationCountryId, x.Code }).IsUnique();

        b.HasMany(x => x.Cities)
            .WithOne(x => x.StateRegion)
            .HasForeignKey(x => x.LocationStateRegionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
