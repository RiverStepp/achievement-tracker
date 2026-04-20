using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class SteamGameGenreConfiguration : IEntityTypeConfiguration<SteamGameGenre>
{
    public void Configure(EntityTypeBuilder<SteamGameGenre> b)
    {
        b.ToTable("SteamGameGenres");

        b.HasKey(x => new { x.GameId, x.GenreId });

        b.HasOne(x => x.Game)
            .WithMany(x => x.GameGenres)
            .HasForeignKey(x => x.GameId)
            .OnDelete(DeleteBehavior.NoAction);

        b.HasOne(x => x.Genre)
            .WithMany(x => x.GameGenres)
            .HasForeignKey(x => x.GenreId)
            .OnDelete(DeleteBehavior.NoAction);

        b.HasIndex(x => x.GenreId);
    }
}

