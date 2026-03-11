using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class SteamLanguageConfiguration : IEntityTypeConfiguration<SteamLanguage>
{
    public void Configure(EntityTypeBuilder<SteamLanguage> b)
    {
        b.ToTable("SteamLanguages");

        b.HasKey(x => x.Id);

        b.Property(x => x.Code)
            .HasMaxLength(3)
            .IsRequired();

        b.Property(x => x.Name)
            .HasMaxLength(100)
            .IsRequired();

        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.CreateDate).HasDefaultValueSql("SYSUTCDATETIME()");
        b.Property(x => x.UpdateDate).HasDefaultValueSql("SYSUTCDATETIME()");

        b.HasIndex(x => x.Code).IsUnique();
    }
}

