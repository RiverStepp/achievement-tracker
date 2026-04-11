using AchievementTracker.Data.Constants;
using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class AppUserSocialLinkConfiguration : IEntityTypeConfiguration<AppUserSocialLink>
{
    public void Configure(EntityTypeBuilder<AppUserSocialLink> b)
    {
        b.ToTable("AppUserSocialLinks");
        b.HasKey(x => x.AppUserSocialLinkId);

        b.Property(x => x.Platform)
            .HasConversion<byte>()
            .HasColumnType("tinyint");

        b.Property(x => x.LinkValue)
            .HasMaxLength(UserSettingsConstraints.MaxSocialLinkValueLength)
            .IsRequired();

        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.CreateDate).HasDefaultValueSql("SYSUTCDATETIME()");
        b.Property(x => x.UpdateDate).HasDefaultValueSql("SYSUTCDATETIME()");

        b.HasOne(x => x.AppUser)
            .WithMany(x => x.SocialLinks)
            .HasForeignKey(x => x.AppUserId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(x => new { x.AppUserId, x.Platform }).IsUnique();
    }
}
