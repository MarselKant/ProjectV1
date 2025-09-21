using System.ComponentModel.DataAnnotations;

namespace ProductService.Models
{
    public class Transfer
    {
        public int Id { get; set; }
        public int FromUserId { get; set; }
        public int ToUserId { get; set; }
        public DateTime TransferDate { get; set; }
        public TransferStatus Status { get; set; }
        public string? Message { get; set; }

        public List<TransferItem> TransferItems { get; set; } = new List<TransferItem>();
    }

    public class TransferItem
    {
        public int Id { get; set; }
        public int TransferId { get; set; }
        public int? ProductId { get; set; }
        public int Quantity { get; set; }

        public string ProductName { get; set; }
        public string ProductDescription { get; set; }
        public string ProductImageUrl { get; set; }
        public decimal ProductPrice { get; set; }
        public string ProductOffice { get; set; }

        public Transfer Transfer { get; set; }
        public Product Product { get; set; }
    }

}