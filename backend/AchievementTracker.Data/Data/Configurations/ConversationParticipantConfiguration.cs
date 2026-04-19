using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class ConversationParticipantConfiguration : IEntityTypeConfiguration<ConversationParticipant>
{
     public void Configure(EntityTypeBuilder<ConversationParticipant> b)
     {
          b.HasKey(x => new { x.ConversationId, x.AppUserPublicId });

          b.Property(x => x.JoinedDate).HasDefaultValueSql("SYSUTCDATETIME()");
          b.Property(x => x.IsMuted).HasDefaultValue(false);

          b.HasIndex(x => new { x.ConversationId, x.AppUserId }).IsUnique();
          b.HasIndex(x => new { x.AppUserId, x.ConversationId });

               b.HasOne(x => x.AppUser)
               .WithMany(u => u.ConversationParticipants)
               .HasForeignKey(x => x.AppUserPublicId)
               .HasPrincipalKey(u => u.PublicId)
               .OnDelete(DeleteBehavior.NoAction);

               b.HasOne(x => x.LastReadMessage)
               .WithMany()
               .HasForeignKey(x => x.LastReadMessageId)
               .OnDelete(DeleteBehavior.NoAction);
     }
}
