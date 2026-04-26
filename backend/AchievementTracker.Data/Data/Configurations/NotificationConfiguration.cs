using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
     public void Configure(EntityTypeBuilder<Notification> b)
     {
          b.HasKey(x => x.NotificationId);

          b.Property(x => x.NotificationType).IsRequired();
          b.Property(x => x.ReferenceId).HasMaxLength(200);
          b.Property(x => x.IsActive).HasDefaultValue(true);
          b.Property(x => x.CreateDate).HasDefaultValueSql("SYSUTCDATETIME()");
          b.Property(x => x.UpdateDate).HasDefaultValueSql("SYSUTCDATETIME()");
          
          b.HasIndex(x => new { x.RecipientAppUserId, x.CreateDate });
          b.HasIndex(x => new { x.RecipientAppUserId, x.ReadDate });

          b.HasOne(x => x.Recipient)
               .WithMany()
               .HasForeignKey(x => x.RecipientAppUserId)
               .OnDelete(DeleteBehavior.NoAction);

          b.HasOne(x => x.Actor)
               .WithMany()
               .HasForeignKey(x => x.ActorAppUserId)
               .OnDelete(DeleteBehavior.NoAction);
     }
}
