using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class SteamGameDeveloperConfiguration : IEntityTypeConfiguration<SteamGameDeveloper>
{
    public void Configure(EntityTypeBuilder<SteamGameDeveloper> b)
    {
        b.ToTable("SteamGameDevelopers");

        b.HasKey(x => new { x.GameId, x.DeveloperId });

        b.HasOne(x => x.Game)
            .WithMany(x => x.GameDevelopers)
            .HasForeignKey(x => x.GameId)
            .OnDelete(DeleteBehavior.NoAction);

        b.HasOne(x => x.Developer)
            .WithMany(x => x.GameDevelopers)
            .HasForeignKey(x => x.DeveloperId)
            .OnDelete(DeleteBehavior.NoAction);

        b.HasIndex(x => x.DeveloperId);
    }
}

