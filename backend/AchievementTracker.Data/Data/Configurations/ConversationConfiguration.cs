using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class ConversationConfiguration : IEntityTypeConfiguration<Conversation>
{
     public void Configure(EntityTypeBuilder<Conversation> b)
     {
          b.HasKey(x => x.ConversationId);

          b.Property(x => x.ConversationType).IsRequired();
          b.Property(x => x.ConversationTitle).HasMaxLength(200);
          b.Property(x => x.ConversationImageUrl).HasMaxLength(500);
          b.Property(x => x.LastMessageDate);
          
          b.Property(x => x.IsActive).HasDefaultValue(true);
          b.Property(x => x.CreateDate).HasDefaultValueSql("SYSUTCDATETIME()");
          b.Property(x => x.UpdateDate).HasDefaultValueSql("SYSUTCDATETIME()");

          b.HasIndex(x => new { x.CreatedByAppUserId, x.LastMessageDate });
 
          b.HasOne(x => x.CreatedBy)
               .WithMany()
               .HasForeignKey(x => x.CreatedByAppUserId)
               .OnDelete(DeleteBehavior.NoAction);

          b.HasMany(x => x.Participants)
               .WithOne(x => x.Conversation)
               .HasForeignKey(x => x.ConversationId)
               .OnDelete(DeleteBehavior.NoAction);

          b.HasMany(x => x.Messages)
               .WithOne(x => x.Conversation)
               .HasForeignKey(x => x.ConversationId)
               .OnDelete(DeleteBehavior.NoAction);
     }
}
