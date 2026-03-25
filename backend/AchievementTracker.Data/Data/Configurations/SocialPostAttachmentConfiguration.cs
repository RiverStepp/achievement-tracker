using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class SocialPostAttachmentConfiguration: IEntityTypeConfiguration<SocialPostAttachment>
{
     public void Configure(EntityTypeBuilder<SocialPostAttachment> b)
     {
          b.ToTable("SocialPostAttachment");
          b.HasKey(x => x.SocialPostAttachmentId);

          b.Property(x => x.AttachmentType)
              .HasConversion<short>()
              .IsRequired();

          b.Property(x => x.Url)
              .HasMaxLength(2048)
              .IsRequired();

          b.Property(x => x.Caption)
              .HasMaxLength(4000);

          b.Property(x => x.DisplayOrder)
              .HasDefaultValue((short)100);

          b.HasIndex(x => new { x.SocialPostId, x.DisplayOrder })
              .IsUnique();
     }
}
