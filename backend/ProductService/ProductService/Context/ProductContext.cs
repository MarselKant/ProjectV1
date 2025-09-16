using Microsoft.EntityFrameworkCore;
using ProductService.Models;

namespace ProductService.Context
{
    public class ProductContext : DbContext
    {
        public DbSet<Product> Products { get; set; }
        public DbSet<TransferHistory> TransferHistories { get; set; }
        public DbSet<Transfer> Transfers { get; set; }
        public DbSet<TransferItem> TransferItems { get; set; }

        public ProductContext(DbContextOptions<ProductContext> options) : base(options)
        {
        }
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseSqlite("Data Source=/data/products.db");
        }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(p => p.Id);
                entity.Property(p => p.Name).IsRequired();
                entity.Property(p => p.Description).HasMaxLength(500);
                entity.Property(p => p.ImageUrl).HasMaxLength(500).IsRequired(false);
                entity.Property(p => p.Price).HasColumnType("decimal(18,2)");
                entity.Property(p => p.UserId).IsRequired(true);
                entity.Property(p => p.Office).HasMaxLength(100).IsRequired(false);
            });

            modelBuilder.Entity<TransferHistory>(entity =>
            {
                entity.HasKey(th => th.Id);
                entity.Property(th => th.Id).ValueGeneratedOnAdd();
                entity.HasOne(th => th.Product)
                      .WithMany(p => p.TransferHistories)
                      .HasForeignKey(th => th.ProductId);
            });
            modelBuilder.Entity<Transfer>(entity =>
            {
                entity.HasKey(t => t.Id);
                entity.Property(t => t.Id).ValueGeneratedOnAdd();
                entity.Property(t => t.TransferDate).IsRequired();
                entity.Property(t => t.Status).IsRequired();
                entity.Property(t => t.Message).HasMaxLength(500);

                entity.HasMany(t => t.TransferItems)
                    .WithOne(ti => ti.Transfer)
                    .HasForeignKey(ti => ti.TransferId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<TransferItem>(entity =>
            {
                entity.HasKey(ti => ti.Id);
                entity.Property(ti => ti.Id).ValueGeneratedOnAdd();
                entity.Property(ti => ti.Quantity).IsRequired().HasDefaultValue(1);

                entity.HasOne(ti => ti.Product)
                    .WithMany()
                    .HasForeignKey(ti => ti.ProductId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Transfer>().HasIndex(t => t.FromUserId);
            modelBuilder.Entity<Transfer>().HasIndex(t => t.ToUserId);
            modelBuilder.Entity<Transfer>().HasIndex(t => t.Status);
            modelBuilder.Entity<Transfer>().HasIndex(t => t.TransferDate);

            modelBuilder.Entity<TransferItem>().HasIndex(ti => ti.TransferId);
            modelBuilder.Entity<TransferItem>().HasIndex(ti => ti.ProductId);
        }
    }
}