using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductService.Context;
using ProductService.Models;
using ProductService.Services;
using System.Net;

namespace ProductService.Controllers
{
    [ApiController]
    [Route("api/transfer")]
    [Authorize]
    public class TransferController : ControllerBase
    {
        private readonly ProductContext _context;
        private readonly AuthServiceClient _authClient;
        private readonly EmailService _emailService;

        public TransferController(ProductContext context, AuthServiceClient authClient, EmailService emailService)
        {
            _context = context;
            _authClient = authClient;
            _emailService = emailService;
        }

        [HttpPost]
        public async Task<ActionResult> TransferProduct([FromBody] TransferRequest request)
        {
            var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

            if (!await _authClient.ValidateTokenAsync(token))
                return Unauthorized();

            var product = await _context.Products.FindAsync(request.ProductId);
            if (product == null) return NotFound("Product not found");
            if (product.UserId != request.FromUserId) return BadRequest("Product doesn't belong to you");

            var transfer = new TransferHistory
            {
                ProductId = request.ProductId,
                FromUserId = request.FromUserId,
                ToUserId = request.ToUserId,
                TransferDate = DateTime.UtcNow,
                Status = TransferStatus.Pending,
                Message = $"Transfer request from {request.FromUserId} to {request.ToUserId}"
            };

            _context.TransferHistories.Add(transfer);
            await _context.SaveChangesAsync();

            await _emailService.SendTransferNotificationAsync(
                request.ToUserId, product.Name, transfer.Id);

            return Ok(new { Message = "Transfer request sent", TransferId = transfer.Id });
        }

        [HttpGet("pending/{userId}")]
        public async Task<ActionResult<List<TransferHistory>>> GetPendingTransfers(string userId)
        {
            var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

            if (!await _authClient.ValidateTokenAsync(token))
                return Unauthorized();

            var pendingTransfers = await _context.TransferHistories
                .Include(th => th.Product)
                .Where(th => th.ToUserId == userId && th.Status == TransferStatus.Pending)
                .ToListAsync();

            return Ok(pendingTransfers);
        }

        [HttpPost("accept/{transferId}")]
        public async Task<ActionResult> AcceptTransfer(int transferId)
        {
            var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

            if (!await _authClient.ValidateTokenAsync(token))
                return Unauthorized();

            var transfer = await _context.TransferHistories
                .Include(th => th.Product)
                .FirstOrDefaultAsync(th => th.Id == transferId);

            if (transfer == null) return NotFound("Transfer not found");

            transfer.Product.UserId = transfer.ToUserId;
            transfer.Status = TransferStatus.Accepted;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Transfer accepted" });
        }

        [HttpPost("reject/{transferId}")]
        public async Task<ActionResult> RejectTransfer(int transferId)
        {
            var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");


            if (!await _authClient.ValidateTokenAsync(token))
                return Unauthorized();

            var transfer = await _context.TransferHistories.FindAsync(transferId);
            if (transfer == null) return NotFound("Transfer not found");

            transfer.Status = TransferStatus.Rejected;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Transfer rejected" });
        }
    }

    public class TransferRequest
    {
        public int ProductId { get; set; }
        public string FromUserId { get; set; }
        public string ToUserId { get; set; }
    }
}
