namespace ProductService.Models
{
    public class TransferHistory
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public int FromUserId { get; set; }
        public int ToUserId { get; set; }
        public DateTime TransferDate { get; set; }
        public TransferStatus Status { get; set; }
        public string Message { get; set; }

        public Product Product { get; set; }
    }
    public enum TransferStatus
    {
        Pending = 0,
        Accepted = 1,
        Rejected = 2,
        Cancelled = 3
    }
}
