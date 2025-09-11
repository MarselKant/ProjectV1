namespace ProductService.Models
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int CountInStock { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string Office { get; set; } = string.Empty;

        public List<TransferHistory> TransferHistories { get; set; }
    }
}
