using Microsoft.EntityFrameworkCore;
using AuthService.Model;

namespace AuthService.Context
{
    public class UserContext : DbContext
    {
        public DbSet<Users> Users { get; set; }

        public UserContext(DbContextOptions<UserContext> options) : base(options)
        {
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseSqlite("Data Source=/data/auth.db");
        }
    }
}