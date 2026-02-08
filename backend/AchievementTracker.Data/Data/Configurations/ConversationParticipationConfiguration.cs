using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class ConversationParticipantConfiguration : IEntityTypeConfiguration<ConversationParticipant>
{
     public void Configure(EntityTypeBuilder<ConversationParticipant> b)
     {
          b.HasKey(x => x.ConversationParticipantId);

          b.Property(x => x.JoinedDate).HasDefaultValueSql("SYSUTCDATETIME()");

          b.HasIndex(x => new { x.ConversationId, x.AppUserId }).IsUnique();

          b.HasOne(x => x.AppUser)
               .WithMany()
               .HasForeignKey(x => x.AppUserId)
               .OnDelete(DeleteBehavior.NoAction);
     }
}
