using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class LocationCountryConfiguration : IEntityTypeConfiguration<LocationCountry>
{
    public void Configure(EntityTypeBuilder<LocationCountry> b)
    {
        b.ToTable("LocationCountries");
        b.HasKey(x => x.LocationCountryId);

        b.Property(x => x.IsoAlpha2)
            .HasMaxLength(2)
            .IsRequired();

        b.Property(x => x.Name)
            .HasMaxLength(120)
            .IsRequired();

        b.HasIndex(x => x.IsoAlpha2).IsUnique();

        b.HasMany(x => x.StateRegions)
            .WithOne(x => x.Country)
            .HasForeignKey(x => x.LocationCountryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
