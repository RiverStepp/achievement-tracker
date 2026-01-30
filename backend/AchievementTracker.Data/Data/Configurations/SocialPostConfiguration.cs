using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class SocialPostConfiguration: IEntityTypeConfiguration<SocialPost>
{
     public void Configure(EntityTypeBuilder<SocialPost> b)
     {
          b.HasKey(x => x.SocialPostId);

          b.Property(x => x.PublicId)
              .HasDefaultValueSql("NEWSEQUENTIALID()")
              .ValueGeneratedOnAdd();

          b.HasIndex(x => x.PublicId).IsUnique();

          b.Property(x => x.Content)
              .HasMaxLength(4000);

          b.HasOne(x => x.AppUser)
              .WithMany(x => x.SocialPosts)
              .HasForeignKey(x => x.AuthorAppUserId)
              .OnDelete(DeleteBehavior.Restrict);

          b.HasMany(x => x.Attachments)
              .WithOne(x => x.Post)
              .HasForeignKey(x => x.SocialPostId)
              .OnDelete(DeleteBehavior.Cascade);

          b.HasMany(x => x.Comments)
              .WithOne(x => x.Post)
              .HasForeignKey(x => x.SocialPostId)
              .OnDelete(DeleteBehavior.Cascade);

          b.HasMany(x => x.Reactions)
              .WithOne(x => x.Post)
              .HasForeignKey(x => x.SocialPostId)
              .OnDelete(DeleteBehavior.Cascade);

          // SocialPostId is included to make ordering deterministic if two things somehow have the same timestamp
          // This is extremely unlikely but two indexes are needed here regardless soooooo
          b.HasIndex(x => new { x.CreateDate, x.SocialPostId });
          b.HasIndex(x => new { x.AuthorAppUserId, x.CreateDate, x.SocialPostId });
     }
}
