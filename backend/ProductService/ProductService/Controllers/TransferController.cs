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

        private async Task<int> GetCurrentUserIdFromToken(string token)
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwtToken = handler.ReadJwtToken(token);
                var usernameClaim = jwtToken.Claims.FirstOrDefault(claim => claim.Type == "unique_name");

                if (usernameClaim != null)
                {
                    var userResponse = await _authClient.GetAsync($"/api/auth/user-id-by-username?username={usernameClaim.Value}");
                    if (userResponse.IsSuccessStatusCode)
                    {
                        var userIdStr = await userResponse.Content.ReadAsStringAsync();
                        if (int.TryParse(userIdStr, out int userIdFromDb))
                        {
                            return userIdFromDb;
                        }
                    }
                }

                return 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting user ID from token: {ex.Message}");
                return 0;
            }
        }

        private async Task<string> GetUsernameById(int userId)
        {
            try
            {
                var response = await _authClient.GetAsync($"/api/auth/username-by-id?userId={userId}");
                if (response.IsSuccessStatusCode)
                {
                    return await response.Content.ReadAsStringAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting username: {ex.Message}");
            }
            return $"User{userId}";
        }

        [HttpPost]
        public async Task<ActionResult> TransferProducts([FromBody] TransferRequestDto transferRequest)
        {
            try
            {
                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

                if (string.IsNullOrEmpty(token) || !token.StartsWith("eyJ"))
                    return Unauthorized(new { message = "Invalid token" });

                int currentUserId = await GetCurrentUserIdFromToken(token);
                if (currentUserId <= 0)
                    return Unauthorized(new { message = "Failed to get user information" });

                if (transferRequest.FromUserId != currentUserId)
                    return BadRequest(new { message = "You can only transfer your own products" });

                if (currentUserId == transferRequest.ToUserId)
                    return BadRequest(new { message = "Cannot transfer products to yourself" });

                // Получаем имена пользователей
                var fromUsername = await GetUsernameById(currentUserId);
                var toUsername = await GetUsernameById(transferRequest.ToUserId);

                var transfer = new Transfer
                {
                    FromUserId = currentUserId,
                    ToUserId = transferRequest.ToUserId,
                    TransferDate = DateTime.UtcNow,
                    Status = TransferStatus.Pending,
                    Message = $"Transfer request from {fromUsername} to {toUsername}"
                };

                _context.Transfers.Add(transfer);
                await _context.SaveChangesAsync();

                foreach (var item in transferRequest.Items)
                {
                    var userProduct = await _context.UserProducts
                        .Include(up => up.Product)
                        .FirstOrDefaultAsync(up => up.UserId == currentUserId && up.ProductId == item.ProductId);

                    if (userProduct == null)
                        return NotFound(new { message = $"Product with ID {item.ProductId} not found in your inventory" });

                    if (item.Quantity <= 0 || item.Quantity > userProduct.CountInStock)
                        return BadRequest(new { message = $"Invalid quantity for product {userProduct.Product.Name}. Available: {userProduct.CountInStock}" });

                    var transferItem = new TransferItem
                    {
                        TransferId = transfer.Id,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        ProductName = userProduct.Product.Name,
                        ProductDescription = userProduct.Product.Description,
                        ProductImageUrl = userProduct.Product.ImageUrl,
                        ProductPrice = userProduct.Product.Price,
                        ProductOffice = userProduct.Product.Office
                    };
                    _context.TransferItems.Add(transferItem);

                    var transferHistory = new TransferHistory
                    {
                        TransferId = transfer.Id,
                        ProductId = item.ProductId,
                        FromUserId = currentUserId,
                        ToUserId = transferRequest.ToUserId,
                        TransferDate = DateTime.UtcNow,
                        Status = TransferStatus.Pending,
                        Message = $"Transfer of {item.Quantity} units of {userProduct.Product.Name} from {fromUsername} to {toUsername}"
                    };
                    _context.TransferHistories.Add(transferHistory);

                    if (item.Quantity == userProduct.CountInStock)
                    {
                        _context.UserProducts.Remove(userProduct);
                    }
                    else
                    {
                        userProduct.CountInStock -= item.Quantity;
                        _context.UserProducts.Update(userProduct);
                    }
                }

                await _context.SaveChangesAsync();

                await SendTransferEmailNotification(transfer.Id, transferRequest.ToUserId, fromUsername, toUsername);

                return Ok(new
                {
                    message = "Transfer request sent successfully",
                    transferId = transfer.Id,
                    itemsCount = transferRequest.Items.Count
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error transferring products: {ex}");
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        private async Task SendTransferEmailNotification(int transferId, int toUserId, string fromUsername, string toUsername)
        {
            try
            {
                var transfer = await _context.Transfers
                    .Include(t => t.TransferItems)
                    .FirstOrDefaultAsync(t => t.Id == transferId);

                if (transfer == null) return;

                var recipientEmailResponse = await _authClient.GetAsync($"/api/auth/user-email?userId={toUserId}");
                if (recipientEmailResponse.IsSuccessStatusCode)
                {
                    var recipientEmail = await recipientEmailResponse.Content.ReadAsStringAsync();

                    if (!string.IsNullOrEmpty(recipientEmail) && recipientEmail.Contains("@"))
                    {
                        // Формируем детальное сообщение
                        var emailBody = new StringBuilder();
                        emailBody.AppendLine($"Уважаемый {toUsername},");
                        emailBody.AppendLine();
                        emailBody.AppendLine($"Вы получили запрос на передачу товаров от пользователя {fromUsername}.");
                        emailBody.AppendLine();
                        emailBody.AppendLine("Детали передачи:");
                        emailBody.AppendLine($"ID передачи: {transferId}");
                        emailBody.AppendLine($"Дата: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}");
                        emailBody.AppendLine();
                        emailBody.AppendLine("Товары:");

                        foreach (var item in transfer.TransferItems)
                        {
                            emailBody.AppendLine($"- {item.ProductName}: {item.Quantity} шт. по {item.ProductPrice} ₽");
                        }

                        emailBody.AppendLine();
                        emailBody.AppendLine("Пожалуйста, войдите в систему для принятия или отклонения передачи.");
                        emailBody.AppendLine();
                        emailBody.AppendLine("С уважением,");
                        emailBody.AppendLine("Система управления товарами");

                        var emailContent = new FormUrlEncodedContent(new[]
                        {
                            new KeyValuePair<string, string>("To", recipientEmail.Trim()),
                            new KeyValuePair<string, string>("Subject", $"Запрос на передачу товаров от {fromUsername}"),
                            new KeyValuePair<string, string>("Body", emailBody.ToString())
                        });

                        await _authClient.PostAsync("/api/auth/send-email", emailContent);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending email notification: {ex.Message}");
            }
        }

        [HttpGet("pending/{userId}")]
        public async Task<ActionResult> GetPendingTransfers(int userId)
        {
            try
            {
                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                if (string.IsNullOrEmpty(token) || !token.StartsWith("eyJ"))
                    return Unauthorized(new { message = "Invalid token" });

                var pendingTransfers = await _context.Transfers
                    .Include(t => t.TransferItems)
                    .Where(t => (t.ToUserId == userId || t.FromUserId == userId) && t.Status == TransferStatus.Pending)
                    .Select(t => new
                    {
                        Id = t.Id,
                        FromUserId = t.FromUserId,
                        ToUserId = t.ToUserId,
                        TransferDate = t.TransferDate,
                        Status = t.Status,
                        Message = t.Message,
                        Items = t.TransferItems.Select(ti => new
                        {
                            ProductId = ti.ProductId,
                            ProductName = ti.ProductName,
                            Quantity = ti.Quantity,
                            ProductPrice = ti.ProductPrice
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(pendingTransfers);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting pending transfers: {ex}");
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpPost("accept/{transferId}")]
        public async Task<ActionResult> AcceptTransfer(int transferId)
        {
            try
            {
                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                if (string.IsNullOrEmpty(token) || !token.StartsWith("eyJ"))
                    return Unauthorized(new { message = "Invalid token" });

                var transfer = await _context.Transfers
                    .Include(t => t.TransferItems)
                    .FirstOrDefaultAsync(t => t.Id == transferId);

                if (transfer == null)
                    return NotFound(new { message = "Transfer not found" });

                int currentUserId = await GetCurrentUserIdFromToken(token);
                if (currentUserId <= 0)
                    return Unauthorized(new { message = "Failed to get user information" });

                if (transfer.ToUserId != currentUserId)
                    return Forbid("You can only accept transfers sent to you");

                if (transfer.Status != TransferStatus.Pending)
                    return BadRequest(new { message = "Transfer is already processed" });

                foreach (var item in transfer.TransferItems)
                {
                    var existingUserProduct = await _context.UserProducts
                        .FirstOrDefaultAsync(up => up.UserId == transfer.ToUserId && up.ProductId == item.ProductId);

                    if (existingUserProduct != null)
                    {
                        existingUserProduct.CountInStock += item.Quantity;
                        _context.UserProducts.Update(existingUserProduct);
                    }
                    else
                    {
                        var newUserProduct = new UserProduct
                        {
                            UserId = transfer.ToUserId,
                            ProductId = item.ProductId.Value,
                            CountInStock = item.Quantity
                        };
                        _context.UserProducts.Add(newUserProduct);
                    }

                    var transferHistory = await _context.TransferHistories
                        .FirstOrDefaultAsync(th => th.TransferId == transferId && th.ProductId == item.ProductId);

                    if (transferHistory != null)
                    {
                        transferHistory.Status = TransferStatus.Accepted;
                        transferHistory.Message = $"Transfer accepted by user {currentUserId}";
                    }
                }

                transfer.Status = TransferStatus.Accepted;
                transfer.Message = $"Transfer accepted by user {currentUserId}";

                await _context.SaveChangesAsync();
                return Ok(new { message = "Transfer accepted successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error accepting transfer: {ex}");
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpPost("reject/{transferId}")]
        public async Task<ActionResult> RejectTransfer(int transferId)
        {
            try
            {
                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                if (string.IsNullOrEmpty(token) || !token.StartsWith("eyJ"))
                    return Unauthorized(new { message = "Invalid token" });

                var transfer = await _context.Transfers
                    .Include(t => t.TransferItems)
                    .FirstOrDefaultAsync(t => t.Id == transferId);

                if (transfer == null)
                    return NotFound(new { message = "Transfer not found" });

                int currentUserId = await GetCurrentUserIdFromToken(token);
                if (currentUserId <= 0)
                    return Unauthorized(new { message = "Failed to get user information" });

                if (transfer.ToUserId != currentUserId && transfer.FromUserId != currentUserId)
                    return Forbid("You don't have access to this transfer");

                if (transfer.Status != TransferStatus.Pending)
                    return BadRequest(new { message = "Transfer is already processed" });

                foreach (var item in transfer.TransferItems)
                {
                    var existingUserProduct = await _context.UserProducts
                        .FirstOrDefaultAsync(up => up.UserId == transfer.FromUserId && up.ProductId == item.ProductId);

                    if (existingUserProduct != null)
                    {
                        existingUserProduct.CountInStock += item.Quantity;
                        _context.UserProducts.Update(existingUserProduct);
                    }
                    else
                    {
                        var returnedUserProduct = new UserProduct
                        {
                            UserId = transfer.FromUserId,
                            ProductId = item.ProductId.Value,
                            CountInStock = item.Quantity
                        };
                        _context.UserProducts.Add(returnedUserProduct);
                    }

                    var transferHistory = await _context.TransferHistories
                        .FirstOrDefaultAsync(th => th.TransferId == transferId && th.ProductId == item.ProductId);

                    if (transferHistory != null)
                    {
                        transferHistory.Status = TransferStatus.Rejected;
                        transferHistory.Message = $"Transfer rejected by user {currentUserId}";
                    }
                }

                transfer.Status = TransferStatus.Rejected;
                transfer.Message = $"Transfer rejected by user {currentUserId}";

                await _context.SaveChangesAsync();
                return Ok(new { message = "Transfer rejected successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error rejecting transfer: {ex}");
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("history/{userId}")]
        public async Task<ActionResult> GetTransferHistory(int userId)
        {
            try
            {
                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                if (string.IsNullOrEmpty(token) || !token.StartsWith("eyJ"))
                    return Unauthorized(new { message = "Invalid token" });

                var transferHistory = await _context.TransferHistories
                    .Where(th => th.FromUserId == userId || th.ToUserId == userId)
                    .OrderByDescending(th => th.TransferDate)
                    .Select(th => new
                    {
                        th.Id,
                        th.TransferId,
                        th.ProductId,
                        th.FromUserId,
                        th.ToUserId,
                        th.TransferDate,
                        th.Status,
                        th.Message
                    })
                    .ToListAsync();

                return Ok(transferHistory);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting transfer history: {ex}");
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }
    }
}