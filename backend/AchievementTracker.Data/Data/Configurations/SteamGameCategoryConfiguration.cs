using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class SteamGameCategoryConfiguration : IEntityTypeConfiguration<SteamGameCategory>
{
    public void Configure(EntityTypeBuilder<SteamGameCategory> b)
    {
        b.ToTable("SteamGameCategories");

        b.HasKey(x => new { x.GameId, x.CategoryId });

        b.HasOne(x => x.Game)
            .WithMany(x => x.GameCategories)
            .HasForeignKey(x => x.GameId)
            .OnDelete(DeleteBehavior.NoAction);

        b.HasOne(x => x.Category)
            .WithMany(x => x.GameCategories)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.NoAction);

        b.HasIndex(x => x.CategoryId);
    }
}

