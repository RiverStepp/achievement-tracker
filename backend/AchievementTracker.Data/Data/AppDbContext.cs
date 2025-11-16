using AchievementTracker.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace AchievementTracker.Data.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ExampleEntity> Examples => Set<ExampleEntity>();

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            // This fallback allows design-time commands to run if DI has not configured the context.
            optionsBuilder.UseSqlServer("Name=ConnectionStrings:DefaultConnection");
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ExampleEntity>(entity =>
        {
            entity.ToTable("Examples");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name)
                  .HasMaxLength(256)
                  .IsRequired();

            entity.Property(e => e.CreatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");
        });
    }
}

