using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ProductService.Models
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string ImageUrl { get; set; }
        public decimal Price { get; set; }
        public string Office { get; set; }
        [JsonIgnore]
        public List<TransferHistory> TransferHistories { get; set; }
        [JsonIgnore]
        public List<UserProduct> UserProducts { get; set; }
    }
}