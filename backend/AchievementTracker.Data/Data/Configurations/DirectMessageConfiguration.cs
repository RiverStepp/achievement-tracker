using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class DirectMessageConfiguration : IEntityTypeConfiguration<DirectMessage>
{
     public void Configure(EntityTypeBuilder<DirectMessage> b)
     {
          b.HasKey(x => x.DirectMessageId);

          b.Property(x => x.Content).HasMaxLength(2000).IsRequired();
          b.Property(x => x.SentDate).HasDefaultValueSql("SYSUTCDATETIME()");

          b.HasIndex(x => new { x.ConversationId, x.SentDate });

          b.HasOne(x => x.Sender)
               .WithMany()
               .HasForeignKey(x => x.SenderAppUserId)
               .OnDelete(DeleteBehavior.NoAction);
     }
}
