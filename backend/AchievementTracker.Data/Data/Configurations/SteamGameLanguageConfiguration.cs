using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class SteamGameLanguageConfiguration : IEntityTypeConfiguration<SteamGameLanguage>
{
    public void Configure(EntityTypeBuilder<SteamGameLanguage> b)
    {
        b.ToTable("SteamGameLanguages");

        b.HasKey(x => new { x.GameId, x.LanguageId });

        b.Property(x => x.HasInterface)
            .HasDefaultValue(false);

        b.Property(x => x.HasFullAudio)
            .HasDefaultValue(false);

        b.Property(x => x.HasSubtitles)
            .HasDefaultValue(false);

        b.HasOne(x => x.Game)
            .WithMany(x => x.GameLanguages)
            .HasForeignKey(x => x.GameId)
            .OnDelete(DeleteBehavior.NoAction);

        b.HasOne(x => x.Language)
            .WithMany(x => x.GameLanguages)
            .HasForeignKey(x => x.LanguageId)
            .OnDelete(DeleteBehavior.NoAction);

        b.HasIndex(x => x.LanguageId);
    }
}

