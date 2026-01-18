using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AchievementTracker.Data.Data.Configurations;

public sealed class RoleConfiguration: IEntityTypeConfiguration<Role>
{
     public void Configure(EntityTypeBuilder<Role> b)
     {
          b.HasKey(x => x.RoleId);

          b.Property(x => x.RoleId)
               .HasConversion<short>()
               .HasColumnType("smallint")
               .ValueGeneratedNever();

          b.Property(x => x.IsActive).HasDefaultValue(true);
          b.Property(x => x.CreateDate).HasDefaultValueSql("SYSUTCDATETIME()");
          b.Property(x => x.UpdateDate).HasDefaultValueSql("SYSUTCDATETIME()");

          b.Property(x => x.Name).HasMaxLength(50).IsRequired();
          b.Property(x => x.Description).HasMaxLength(200);

          b.HasIndex(x => x.Name).IsUnique();
     }
}
