using AchievementTracker.Data.Entities;
using AchievementTracker.Data.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class SteamGamePlatformConfiguration : IEntityTypeConfiguration<SteamGamePlatform>
{
    public void Configure(EntityTypeBuilder<SteamGamePlatform> b)
    {
        b.ToTable("SteamGamePlatforms");

        b.HasKey(x => new { x.GameId, x.Platform });

        b.Property(x => x.Platform)
            .HasConversion<byte>()
            .HasColumnType("tinyint")
            .IsRequired();

        b.HasOne(x => x.Game)
            .WithMany(x => x.Platforms)
            .HasForeignKey(x => x.GameId)
            .OnDelete(DeleteBehavior.NoAction);

        var enumValues = string.Join(", ",
            Enum.GetValues<ePlatform>().Select(v => (byte)v)
        );

        b.ToTable(tb =>
            tb.HasCheckConstraint(
                "CK_SteamGamePlatforms_Platform",
                $"[Platform] IN ({enumValues})"
            )
        );
    }
}

