using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
 
namespace AchievementTracker.Data.Data.Configurations;
 
public sealed class MessageEmbedConfiguration : IEntityTypeConfiguration<MessageEmbed>
{
     public void Configure(EntityTypeBuilder<MessageEmbed> b)
     {
          b.HasKey(x => x.MessageEmbedId);
 
          b.Property(x => x.EmbedType).IsRequired();
          b.Property(x => x.Url).HasMaxLength(2048).IsRequired();
          b.Property(x => x.Title).HasMaxLength(256);
          b.Property(x => x.Description).HasMaxLength(4000);
          b.Property(x => x.ThumbnailUrl).HasMaxLength(2048);
 
          b.HasIndex(x => x.DirectMessageId);
 
          b.HasOne(x => x.DirectMessage)
               .WithMany(x => x.Embeds)
               .HasForeignKey(x => x.DirectMessageId)
               .OnDelete(DeleteBehavior.Cascade);
     }
}
