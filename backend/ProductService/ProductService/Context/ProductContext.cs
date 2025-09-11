using Microsoft.EntityFrameworkCore;
using ProductService.Models;

namespace ProductService.Context
{
    public class ProductContext : DbContext
    {
        public DbSet<Product> Products { get; set; }
        public DbSet<TransferHistory> TransferHistories { get; set; }

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
                entity.Property(p => p.Name).IsRequired().HasMaxLength(100);
                entity.Property(p => p.Description).HasMaxLength(500);
                entity.Property(p => p.ImageUrl).HasMaxLength(500).IsRequired(false);
                entity.Property(p => p.Price).HasColumnType("decimal(18,2)");
                entity.Property(p => p.UserId).IsRequired(false);
                entity.Property(p => p.Office).HasMaxLength(100).IsRequired(false);
            });

            modelBuilder.Entity<TransferHistory>(entity =>
            {
                entity.HasKey(th => th.Id);
                entity.HasOne(th => th.Product)
                      .WithMany(p => p.TransferHistories)
                      .HasForeignKey(th => th.ProductId);
            });
        }
    }
}
