namespace ProductService.Models
{
    public class TransferRequestDto
    {
        public int FromUserId { get; set; }
        public int ToUserId { get; set; }
        public List<TransferItemRequest> Items { get; set; } = new List<TransferItemRequest>();
    }

    public class TransferItemRequest
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
}
