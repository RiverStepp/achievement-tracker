using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class UserRoleConfiguration: IEntityTypeConfiguration<UserRole>
{
     public void Configure(EntityTypeBuilder<UserRole> b)
     {
          b.HasKey(x => new { x.AppUserId, x.RoleId });

          b.HasOne(x => x.AppUser)
              .WithMany(x => x.UserRoles)
              .HasForeignKey(x => x.AppUserId)
              .OnDelete(DeleteBehavior.Cascade);

          b.HasOne(x => x.Role)
              .WithMany(x => x.UserRoles)
              .HasForeignKey(x => x.RoleId)
              .OnDelete(DeleteBehavior.Cascade);

          b.HasIndex(x => x.RoleId);
     }
}
