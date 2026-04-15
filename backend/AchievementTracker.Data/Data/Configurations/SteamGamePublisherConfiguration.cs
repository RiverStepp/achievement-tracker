using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class SteamGamePublisherConfiguration : IEntityTypeConfiguration<SteamGamePublisher>
{
    public void Configure(EntityTypeBuilder<SteamGamePublisher> b)
    {
        b.ToTable("SteamGamePublishers");

        b.HasKey(x => new { x.GameId, x.PublisherId });

        b.HasOne(x => x.Game)
            .WithMany(x => x.GamePublishers)
            .HasForeignKey(x => x.GameId)
            .OnDelete(DeleteBehavior.NoAction);

        b.HasOne(x => x.Publisher)
            .WithMany(x => x.GamePublishers)
            .HasForeignKey(x => x.PublisherId)
            .OnDelete(DeleteBehavior.NoAction);

        b.HasIndex(x => x.PublisherId);
    }
}

