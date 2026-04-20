using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class PronounOptionConfiguration : IEntityTypeConfiguration<PronounOption>
{
    public void Configure(EntityTypeBuilder<PronounOption> b)
    {
        b.ToTable("PronounOptions");
        b.HasKey(x => x.PronounOptionId);

        b.Property(x => x.Code)
            .HasMaxLength(64)
            .IsRequired();

        b.Property(x => x.DisplayLabel)
            .HasMaxLength(120)
            .IsRequired();

        b.HasIndex(x => x.Code).IsUnique();
    }
}
