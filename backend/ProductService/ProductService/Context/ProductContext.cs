using Microsoft.EntityFrameworkCore;
using ProductService.Models;

namespace ProductService.Context
{
    public class ProductContext : DbContext
    {
        public DbSet<Product> Products { get; set; }
        public DbSet<UserProduct> UserProducts { get; set; }
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
                entity.Property(p => p.Office).HasMaxLength(100).IsRequired(false);
            });

            modelBuilder.Entity<UserProduct>(entity =>
            {
                entity.HasKey(up => up.Id);
                entity.Property(up => up.UserId).IsRequired();
                entity.Property(up => up.ProductId).IsRequired();
                entity.Property(up => up.CountInStock).IsRequired().HasDefaultValue(1);
                
                entity.HasOne(up => up.Product)
                    .WithMany(p => p.UserProducts)
                    .HasForeignKey(up => up.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<TransferHistory>(entity =>
            {
                entity.HasKey(th => th.Id);
                entity.Property(th => th.Id).ValueGeneratedOnAdd();
                entity.HasOne(th => th.Product)
                    .WithMany(p => p.TransferHistories)
                    .HasForeignKey(th => th.ProductId)
                    .OnDelete(DeleteBehavior.SetNull);
                entity.Property(th => th.ProductId).IsRequired(false);
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

                entity.Property(ti => ti.ProductName).IsRequired();
                entity.Property(ti => ti.ProductDescription).HasMaxLength(500);
                entity.Property(ti => ti.ProductImageUrl).HasMaxLength(500).IsRequired(false);
                entity.Property(ti => ti.ProductPrice).HasColumnType("decimal(18,2)");
                entity.Property(ti => ti.ProductOffice).HasMaxLength(100).IsRequired(false);

                entity.Property(ti => ti.ProductId).IsRequired(false);

                entity.HasOne(ti => ti.Product)
                    .WithMany()
                    .HasForeignKey(ti => ti.ProductId)
                    .OnDelete(DeleteBehavior.SetNull);
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