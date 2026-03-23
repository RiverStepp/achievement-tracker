using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
 
namespace AchievementTracker.Data.Data.Configurations;
 
public sealed class UserAchievementSummaryConfiguration : IEntityTypeConfiguration<UserAchievementSummary>
{
     public void Configure(EntityTypeBuilder<UserAchievementSummary> b)
     {
          b.ToTable("UserAchievementSummaries");
 
          b.HasKey(x => x.AppUserId);
          b.Property(x => x.AppUserId).ValueGeneratedNever();
 
          b.Property(x => x.IsActive).HasDefaultValue(true);
          b.Property(x => x.CreateDate).HasDefaultValueSql("SYSUTCDATETIME()");
          b.Property(x => x.UpdateDate).HasDefaultValueSql("SYSUTCDATETIME()");
 
          b.HasOne(x => x.AppUser)
               .WithOne()
               .HasForeignKey<UserAchievementSummary>(x => x.AppUserId)
               .OnDelete(DeleteBehavior.Cascade);
     }
}
