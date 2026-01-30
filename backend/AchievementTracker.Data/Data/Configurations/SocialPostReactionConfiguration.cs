using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class SocialPostReactionConfiguration: IEntityTypeConfiguration<SocialPostReaction>
{
     public void Configure(EntityTypeBuilder<SocialPostReaction> b)
     {
          b.HasKey(x => new { x.SocialPostId, x.AppUserId });

          b.Property(x => x.ReactionType)
              .HasConversion<short>()
              .IsRequired();

          b.HasOne(x => x.Post)
              .WithMany(x => x.Reactions)
              .HasForeignKey(x => x.SocialPostId)
              .OnDelete(DeleteBehavior.Cascade);

          b.HasOne(x => x.AppUser)
              .WithMany()
              .HasForeignKey(x => x.AppUserId)
              .OnDelete(DeleteBehavior.Restrict);

          b.HasIndex(x => x.SocialPostId);
     }
}

