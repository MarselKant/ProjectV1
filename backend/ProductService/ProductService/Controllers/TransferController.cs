using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductService.Context;
using ProductService.Models;
using ProductService.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Text;

namespace ProductService.Controllers
{
    [ApiController]
    [Route("api/transfer")]
    [Authorize]
    public class TransferController : ControllerBase
    {
        private readonly ProductContext _context;
        private readonly AuthServiceClient _authClient;

        public TransferController(ProductContext context, AuthServiceClient authClient)
        {
            _context = context;
            _authClient = authClient;
        }

        [HttpPost]
        public async Task<ActionResult> TransferProducts([FromBody] TransferRequestDto transferRequest)
        {
            try
            {
                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

                if (!await _authClient.ValidateTokenAsync(token))
                    return Unauthorized();

                var currentUserId = GetCurrentUserIdFromToken(token);
                if (currentUserId <= 0)
                {
                    if (currentUserId == -1)
                        return NotFound("User not found in system");
                    return StatusCode(500, "Failed to get user information");
                }

                if (transferRequest.FromUserId != currentUserId)
                    return BadRequest("You can only transfer your own products");

                if (currentUserId == transferRequest.ToUserId)
                    return BadRequest("Cannot transfer products to yourself");

                foreach (var item in transferRequest.Items)
                {
                    var product = await _context.Products.FindAsync(item.ProductId);
                    if (product == null)
                        return NotFound($"Product with ID {item.ProductId} not found");

                    if (product.UserId != currentUserId)
                        return BadRequest($"Product {product.Name} doesn't belong to you");

                    if (item.Quantity <= 0 || item.Quantity > product.CountInStock)
                        return BadRequest($"Invalid quantity for product {product.Name}. Available: {product.CountInStock}");
                }

                var transfer = new Transfer
                {
                    FromUserId = currentUserId,
                    ToUserId = transferRequest.ToUserId,
                    TransferDate = DateTime.UtcNow,
                    Status = TransferStatus.Pending,
                    Message = $"Transfer request from {currentUserId} to {transferRequest.ToUserId}"
                };

                foreach (var item in transferRequest.Items)
                {
                    var product = await _context.Products.FindAsync(item.ProductId);

                    transfer.TransferItems.Add(new TransferItem
                    {
                        ProductId = item.ProductId,
                        Quantity = item.Quantity
                    });

                    var transferHistory = new TransferHistory
                    {
                        ProductId = item.ProductId,
                        FromUserId = currentUserId,
                        ToUserId = transferRequest.ToUserId,
                        TransferDate = DateTime.UtcNow,
                        Status = TransferStatus.Pending,
                        Message = $"Transfer of {item.Quantity} units from {currentUserId} to {transferRequest.ToUserId}"
                    };
                    _context.TransferHistories.Add(transferHistory);
                }

                _context.Transfers.Add(transfer);
                await _context.SaveChangesAsync();

                var recipientEmail = await GetUserEmailAsync(transferRequest.ToUserId.ToString());

                if (!string.IsNullOrEmpty(recipientEmail))
                {
                    await SendEmailNotificationAsync(
                        recipientEmail,
                        transfer.Id,
                        transferRequest.Items
                    );
                }
                else
                {
                    Console.WriteLine($"Could not find email for user ID: {transferRequest.ToUserId}");
                }

                return Ok(new
                {
                    Message = "Transfer request sent",
                    TransferId = transfer.Id,
                    ItemsCount = transferRequest.Items.Count
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error transferring products: {ex}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        private async Task<string> GetUserEmailAsync(string userId)
        {
            try
            {
                var response = await _authClient.GetAsync($"/api/auth/user-email?userId={userId}");

                if (response.IsSuccessStatusCode)
                {
                    return await response.Content.ReadAsStringAsync();
                }

                Console.WriteLine($"Failed to get email for user {userId}: {response.StatusCode}");
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting user email: {ex.Message}");
                return null;
            }
        }

        private async Task SendEmailNotificationAsync(string toEmail, int transferId, List<TransferItemRequest> items)
        {
            try
            {
                var productDetails = new StringBuilder();
                productDetails.AppendLine("Transfer items details:");
                productDetails.AppendLine("-----------------------");

                foreach (var item in items)
                {
                    var product = await _context.Products.FindAsync(item.ProductId);
                    if (product != null)
                    {
                        productDetails.AppendLine($"- {product.Name}: {item.Quantity} units");
                        productDetails.AppendLine($"  Description: {product.Description}");
                        productDetails.AppendLine($"  Price: {product.Price:C}");
                        productDetails.AppendLine();
                    }
                    else
                    {
                        productDetails.AppendLine($"- Product ID {item.ProductId}: {item.Quantity} units");
                        productDetails.AppendLine();
                    }
                }

                var subject = "Transfer Request Notification";
                var body = $@"
                You have received a transfer request with {items.Count} product(s).
                
                Transfer ID: {transferId}
                Items count: {items.Count}
                
                {productDetails}
                
                Please accept or reject the transfer request in the system.
                ";

                var emailContent = new FormUrlEncodedContent(new[]
                {
            new KeyValuePair<string, string>("To", toEmail),
            new KeyValuePair<string, string>("Subject", subject),
            new KeyValuePair<string, string>("Body", body)
        });

                var response = await _authClient.PostAsync("/api/auth/send-email", emailContent);

                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Email sent successfully to {toEmail}");
                }
                else
                {
                    Console.WriteLine($"Failed to send email to {toEmail}: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending email: {ex.Message}");
            }
        }

        [HttpPost("accept/{transferId}")]
        public async Task<ActionResult> AcceptTransfer(int transferId)
        {
            try
            {
                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

                if (!await _authClient.ValidateTokenAsync(token))
                    return Unauthorized();

                var transfer = await _context.Transfers
                    .Include(t => t.TransferItems)
                    .ThenInclude(ti => ti.Product)
                    .FirstOrDefaultAsync(t => t.Id == transferId);

                if (transfer == null)
                    return NotFound("Transfer not found");

                var currentUserId = GetCurrentUserIdFromToken(token);

                if (transfer.ToUserId != currentUserId)
                    return StatusCode(403, new { Message = "You don't have access to do this" });

                if (transfer.Status != TransferStatus.Pending)
                    return BadRequest("Transfer is already processed");

                foreach (var item in transfer.TransferItems)
                {
                    var originalProduct = await _context.Products.FindAsync(item.ProductId);
                    if (originalProduct != null)
                    {
                        originalProduct.CountInStock -= item.Quantity;

                        if (originalProduct.CountInStock <= 0)
                        {
                            _context.Products.Remove(originalProduct);
                        }

                        _context.Products.Update(originalProduct);

                        var newProduct = new Product
                        {
                            Name = originalProduct.Name,
                            Description = originalProduct.Description,
                            ImageUrl = originalProduct.ImageUrl,
                            Price = originalProduct.Price,
                            CountInStock = item.Quantity,
                            UserId = transfer.ToUserId,
                            Office = originalProduct.Office
                        };

                        _context.Products.Add(newProduct);
                    }

                    var transferHistory = await _context.TransferHistories
                        .FirstOrDefaultAsync(th => th.ProductId == item.ProductId &&
                                                 th.FromUserId == transfer.FromUserId &&
                                                 th.ToUserId == transfer.ToUserId &&
                                                 th.Status == TransferStatus.Pending);

                    if (transferHistory != null)
                    {
                        transferHistory.Status = TransferStatus.Accepted;
                        transferHistory.Message = $"Transfer accepted by user {currentUserId}";
                    }
                }

                transfer.Status = TransferStatus.Accepted;
                transfer.Message = $"Transfer accepted by user {currentUserId}";

                await _context.SaveChangesAsync();

                return Ok(new { Message = "Transfer accepted", ItemsCount = transfer.TransferItems.Count });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error accepting transfer: {ex}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("reject/{transferId}")]
        public async Task<ActionResult> RejectTransfer(int transferId)
        {
            try
            {
                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

                if (!await _authClient.ValidateTokenAsync(token))
                    return Unauthorized();

                var transfer = await _context.Transfers
                    .Include(t => t.TransferItems)
                    .FirstOrDefaultAsync(t => t.Id == transferId);

                if (transfer == null)
                    return NotFound("Transfer not found");

                var currentUserId = GetCurrentUserIdFromToken(token);

                if (transfer.ToUserId != currentUserId)
                    return StatusCode(403, new { Message = "You don't have access to do this" });

                if (transfer.Status != TransferStatus.Pending)
                    return BadRequest("Transfer is already processed");

                foreach (var item in transfer.TransferItems)
                {
                    var transferHistory = await _context.TransferHistories
                        .FirstOrDefaultAsync(th => th.ProductId == item.ProductId &&
                                                 th.FromUserId == transfer.FromUserId &&
                                                 th.ToUserId == transfer.ToUserId &&
                                                 th.Status == TransferStatus.Pending);

                    if (transferHistory != null)
                    {
                        transferHistory.Status = TransferStatus.Rejected;
                        transferHistory.Message = $"Transfer rejected by user {currentUserId}";
                    }
                }

                transfer.Status = TransferStatus.Rejected;
                transfer.Message = $"Transfer rejected by user {currentUserId}";

                await _context.SaveChangesAsync();

                return Ok(new { Message = "Transfer rejected", ItemsCount = transfer.TransferItems.Count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("pending/{userId}")]
        public async Task<ActionResult<List<TransferHistory>>> GetPendingTransfers(int userId)
        {
            try
            {
                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

                if (!await _authClient.ValidateTokenAsync(token))
                    return Unauthorized();

                var currentUserId = GetCurrentUserIdFromToken(token);

                if (userId != currentUserId)
                    return StatusCode(403, new { Message = "You don't have access to do this" });

                var pendingTransfers = await _context.TransferHistories
                    .Include(th => th.Product)
                    .Where(th => th.ToUserId == userId && th.Status == TransferStatus.Pending)
                    .Select(th => new
                    {
                        th.Id,
                        TransferId = th.Id,
                        th.ProductId,
                        th.FromUserId,
                        th.ToUserId,
                        th.TransferDate,
                        th.Status,
                        th.Message,
                        th.Product
                    })
                    .ToListAsync();

                return Ok(pendingTransfers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("sent/{userId}")]
        public async Task<ActionResult<List<TransferHistory>>> GetSentTransfers(int userId)
        {
            try
            {
                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

                if (!await _authClient.ValidateTokenAsync(token))
                    return Unauthorized();

                var currentUserId = GetCurrentUserIdFromToken(token);

                if (userId != currentUserId)
                    return Forbid("You can only view your own sent transfers");

                var sentTransfers = await _context.TransferHistories
                    .Include(th => th.Product)
                    .Where(th => th.FromUserId == userId)
                    .ToListAsync();

                return Ok(sentTransfers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("users")]
        public async Task<ActionResult<List<UserDto>>> GetUsers([FromQuery] string search = "")
        {
            try
            {
                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

                if (!await _authClient.ValidateTokenAsync(token))
                    return Unauthorized();

                var users = new List<UserDto>
                {
                    new UserDto { Id = 1, Login = "root", Email = "root@example.com" },
                    new UserDto { Id = 2, Login = "asd", Email = "asd@example.com" }
                };

                if (!string.IsNullOrEmpty(search))
                {
                    users = users.Where(u =>
                        u.Login.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                        u.Email.Contains(search, StringComparison.OrdinalIgnoreCase))
                        .ToList();
                }

                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        private int GetCurrentUserIdFromToken(string token)
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwtToken = handler.ReadJwtToken(token);
                var username = jwtToken.Claims.First(claim => claim.Type == "unique_name").Value;
                var userMap = new Dictionary<string, int>
                {
                    { "root", 1 },
                    { "asd", 2 }
                };

                return userMap.GetValueOrDefault(username, 0);
            }
            catch
            {
                return 0;
            }
        }

        public class UserDto
        {
            public int Id { get; set; }
            public string Login { get; set; }
            public string Email { get; set; }
        }

        private ObjectResult Forbid(string message)
        {
            return StatusCode(403, new { Message = message });
        }
    }
}