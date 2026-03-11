using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class SteamGamePriceConfiguration : IEntityTypeConfiguration<SteamGamePrice>
{
    public void Configure(EntityTypeBuilder<SteamGamePrice> b)
    {
        b.ToTable("SteamGamePrices");

        b.HasKey(x => x.Id);

        b.Property(x => x.GameId)
            .IsRequired();

        b.Property(x => x.Price)
            .HasColumnType("decimal(18, 3)")
            .IsRequired();

        b.Property(x => x.OriginalPrice)
            .HasColumnType("decimal(18, 3)")
            .IsRequired();

        b.Property(x => x.CurrencyCode)
            .HasMaxLength(3)
            .IsRequired();

        b.Property(x => x.OriginalCurrencyCode)
            .HasMaxLength(3)
            .IsRequired();

        b.Property(x => x.RecordedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        b.HasOne(x => x.Game)
            .WithMany(x => x.Prices)
            .HasForeignKey(x => x.GameId)
            .OnDelete(DeleteBehavior.NoAction);

        b.HasIndex(x => new { x.GameId, x.RecordedAt })
            .IsDescending(false, true);
    }
}

