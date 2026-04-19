using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class SocialPostCommentConfiguration: IEntityTypeConfiguration<SocialPostComment>
{
     public void Configure(EntityTypeBuilder<SocialPostComment> b)
     {
          b.ToTable("SocialPostComments");
          b.HasKey(x => x.SocialPostCommentId);

          b.Property(x => x.PublicId)
              .HasDefaultValueSql("NEWSEQUENTIALID()")
              .ValueGeneratedOnAdd();

          b.HasIndex(x => x.PublicId).IsUnique();

          b.Property(x => x.Body)
              .HasMaxLength(4000)
              .IsRequired();

          b.HasOne(x => x.Post)
              .WithMany(x => x.Comments)
              .HasForeignKey(x => x.SocialPostId)
              .OnDelete(DeleteBehavior.Cascade);

          b.HasOne(x => x.AppUser)
              .WithMany()
              .HasForeignKey(x => x.AuthorAppUserId)
              .OnDelete(DeleteBehavior.Restrict);

          b.HasOne(x => x.ParentComment)
              .WithMany(x => x.Replies)
              .HasForeignKey(x => x.ParentCommentId)
              .OnDelete(DeleteBehavior.Restrict);

          b.HasIndex(x => new { x.SocialPostId, x.CreateDate, x.SocialPostCommentId });
          b.HasIndex(x => x.ParentCommentId);
     }
}
