namespace ProductService.Models
{
    public class UserProduct
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int ProductId { get; set; }
        public int CountInStock { get; set; }

        public Product Product { get; set; }
    }
}
