using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class SteamGameReviewConfiguration : IEntityTypeConfiguration<SteamGameReview>
{
    public void Configure(EntityTypeBuilder<SteamGameReview> b)
    {
        b.ToTable("SteamGameReviews");

        b.HasKey(x => x.Id);

        b.Property(x => x.GameId)
            .IsRequired();

        b.Property(x => x.SteamRating)
            .IsRequired();

        b.Property(x => x.MetacriticScore);

        b.Property(x => x.Recommendations);

        b.Property(x => x.RecordedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        b.HasOne(x => x.Game)
            .WithMany(x => x.Reviews)
            .HasForeignKey(x => x.GameId)
            .OnDelete(DeleteBehavior.NoAction);

        b.HasIndex(x => x.GameId);

        b.ToTable(tb =>
            tb.HasCheckConstraint(
                "CK_SteamGameReviews_Metacritic",
                "[MetacriticScore] IS NULL OR ([MetacriticScore] BETWEEN 0 AND 100)"
            )
        );
    }
}

