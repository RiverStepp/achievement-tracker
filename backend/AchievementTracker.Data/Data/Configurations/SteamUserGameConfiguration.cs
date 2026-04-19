using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class SteamUserGameConfiguration : IEntityTypeConfiguration<SteamUserGame>
{
    public void Configure(EntityTypeBuilder<SteamUserGame> b)
    {
        b.ToTable("SteamUserGames");

        b.HasKey(x => x.Id);

        b.Property(x => x.SteamId)
            .IsRequired();

        b.Property(x => x.GameId)
            .IsRequired();

        b.Property(x => x.PlaytimeForever)
            .HasDefaultValue(0);

        b.Property(x => x.LastPlayedAt);

        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.CreateDate).HasDefaultValueSql("SYSUTCDATETIME()");
        b.Property(x => x.UpdateDate).HasDefaultValueSql("SYSUTCDATETIME()");

        b.HasOne(x => x.UserSteamProfile)
            .WithMany(x => x.UserGames)
            .HasForeignKey(x => x.SteamId)
            .OnDelete(DeleteBehavior.NoAction);

        b.HasOne(x => x.Game)
            .WithMany(x => x.UserGames)
            .HasForeignKey(x => x.GameId)
            .OnDelete(DeleteBehavior.NoAction);

        b.HasIndex(x => x.SteamId);
        b.HasIndex(x => x.GameId);

        b.HasIndex(x => new { x.SteamId, x.GameId })
            .IsUnique();
    }
}

