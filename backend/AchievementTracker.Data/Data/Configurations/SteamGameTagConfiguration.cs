using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class SteamGameTagConfiguration : IEntityTypeConfiguration<SteamGameTag>
{
    public void Configure(EntityTypeBuilder<SteamGameTag> b)
    {
        b.ToTable("SteamGameTags");

        b.HasKey(x => new { x.GameId, x.TagId });

        b.HasOne(x => x.Game)
            .WithMany(x => x.GameTags)
            .HasForeignKey(x => x.GameId)
            .OnDelete(DeleteBehavior.NoAction);

        b.HasOne(x => x.Tag)
            .WithMany(x => x.GameTags)
            .HasForeignKey(x => x.TagId)
            .OnDelete(DeleteBehavior.NoAction);

        b.HasIndex(x => x.TagId);
    }
}

