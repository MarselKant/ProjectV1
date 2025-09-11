namespace ProductService.Models
{
    public class TransferHistory
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string FromUserId { get; set; }
        public string ToUserId { get; set; }
        public DateTime TransferDate { get; set; }
        public TransferStatus Status { get; set; }
        public string Message { get; set; }

        public Product Product { get; set; }
    }
    public enum TransferStatus
    {
        Pending,
        Accepted,
        Rejected
    }
}
