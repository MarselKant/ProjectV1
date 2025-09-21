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

                var currentUserId = await GetCurrentUserIdFromTokenAsync(token);
                if (currentUserId <= 0)
                    return StatusCode(500, "Failed to get user information");

                if (transferRequest.FromUserId != currentUserId)
                    return BadRequest("You can only transfer your own products");

                if (currentUserId == transferRequest.ToUserId)
                    return BadRequest("Cannot transfer products to yourself");

                var transfer = new Transfer
                {
                    FromUserId = currentUserId,
                    ToUserId = transferRequest.ToUserId,
                    TransferDate = DateTime.UtcNow,
                    Status = TransferStatus.Pending,
                    Message = $"Transfer request from {currentUserId} to {transferRequest.ToUserId}"
                };

                _context.Transfers.Add(transfer);
                await _context.SaveChangesAsync();

                foreach (var item in transferRequest.Items)
                {
                    var userProduct = await _context.UserProducts
                        .Include(up => up.Product)
                        .FirstOrDefaultAsync(up => up.UserId == currentUserId && up.ProductId == item.ProductId);

                    if (userProduct == null)
                        return NotFound($"Product with ID {item.ProductId} not found in your inventory");

                    if (item.Quantity <= 0 || item.Quantity > userProduct.CountInStock)
                        return BadRequest($"Invalid quantity for product {userProduct.Product.Name}. Available: {userProduct.CountInStock}");

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
                    transfer.TransferItems.Add(transferItem);

                    var transferHistory = new TransferHistory
                    {
                        TransferId = transfer.Id,
                        ProductId = item.ProductId,
                        FromUserId = currentUserId,
                        ToUserId = transferRequest.ToUserId,
                        TransferDate = DateTime.UtcNow,
                        Status = TransferStatus.Pending,
                        Message = $"Transfer of {item.Quantity} units of {userProduct.Product.Name} from {currentUserId} to {transferRequest.ToUserId}"
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

                var recipientEmail = await GetUserEmailAsync(transferRequest.ToUserId.ToString());
                if (!string.IsNullOrEmpty(recipientEmail))
                {
                    await SendEmailNotificationAsync(recipientEmail, transfer.Id, transferRequest.Items);
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
                    var email = await response.Content.ReadAsStringAsync();
                    if (!string.IsNullOrEmpty(email) && email.Contains("@"))
                    {
                        return email.Trim();
                    }
                }

                return null;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        private async Task SendEmailNotificationAsync(string toEmail, int transferId, List<TransferItemRequest> items)
        {
            try
            {
                var transferItems = await _context.TransferItems
                    .Where(ti => ti.TransferId == transferId)
                    .ToListAsync();

                var productDetails = new StringBuilder();
                productDetails.AppendLine("Детали передачи товаров:");
                productDetails.AppendLine("=========================");
                productDetails.AppendLine();

                foreach (var item in transferItems)
                {
                    productDetails.AppendLine($"Товар: {item.ProductName}");
                    productDetails.AppendLine($"Количество: {item.Quantity} шт.");
                    productDetails.AppendLine($"Описание: {item.ProductDescription}");
                    productDetails.AppendLine($"Цена: {item.ProductPrice:C}");
                    productDetails.AppendLine($"Офис: {item.ProductOffice}");

                    if (!string.IsNullOrEmpty(item.ProductImageUrl))
                    {
                        productDetails.AppendLine($"Изображение: {item.ProductImageUrl}");
                    }

                    productDetails.AppendLine("-------------------------");
                    productDetails.AppendLine();
                }

                var subject = "Уведомление о запросе передачи товаров";
                var body = $@"
                    Уважаемый пользователь,

                    Вы получили запрос на передачу товаров.

                    ID передачи: {transferId}
                    Количество товаров: {transferItems.Count}

                    {productDetails}

                    Пожалуйста, примите или отклоните запрос передачи в системе.

                    С уважением,
                    Система управления товарами
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
                    Console.WriteLine($"Email успешно отправлен на {toEmail}");
                }
                else
                {
                    Console.WriteLine($"Ошибка отправки email на {toEmail}: {response.StatusCode}");
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Детали ошибки: {errorContent}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка отправки email: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
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
                    .FirstOrDefaultAsync(t => t.Id == transferId);

                if (transfer == null)
                    return NotFound("Transfer not found");

                var currentUserId = await GetCurrentUserIdFromTokenAsync(token);
                if (transfer.ToUserId != currentUserId)
                    return StatusCode(403, new { Message = "You don't have access to do this" });

                if (transfer.Status != TransferStatus.Pending)
                    return BadRequest("Transfer is already processed");

                foreach (var item in transfer.TransferItems)
                {
                    // Проверяем, есть ли уже такой товар у получателя
                    var existingUserProduct = await _context.UserProducts
                        .FirstOrDefaultAsync(up => up.UserId == transfer.ToUserId && up.ProductId == item.ProductId);

                    if (existingUserProduct != null)
                    {
                        // Если товар уже есть - увеличиваем количество
                        existingUserProduct.CountInStock += item.Quantity;
                        _context.UserProducts.Update(existingUserProduct);
                    }
                    else
                    {
                        // Если товара нет - создаем новую запись
                        var newUserProduct = new UserProduct
                        {
                            UserId = transfer.ToUserId,
                            ProductId = item.ProductId.Value,
                            CountInStock = item.Quantity
                        };
                        _context.UserProducts.Add(newUserProduct);
                    }

                    // Обновляем историю передачи
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

                var currentUserId = await GetCurrentUserIdFromTokenAsync(token);
                if (transfer.FromUserId != currentUserId && transfer.ToUserId != currentUserId)
                    return StatusCode(403, new { Message = "You don't have access to reject this transfer" });

                if (transfer.Status != TransferStatus.Pending)
                    return BadRequest("Transfer is already processed");

                foreach (var item in transfer.TransferItems)
                {
                    // Возвращаем товар отправителю
                    var existingUserProduct = await _context.UserProducts
                        .FirstOrDefaultAsync(up => up.UserId == transfer.FromUserId && up.ProductId == item.ProductId);

                    if (existingUserProduct != null)
                    {
                        // Если запись уже есть - увеличиваем количество
                        existingUserProduct.CountInStock += item.Quantity;
                        _context.UserProducts.Update(existingUserProduct);
                    }
                    else
                    {
                        // Если записи нет - создаем новую
                        var returnedUserProduct = new UserProduct
                        {
                            UserId = transfer.FromUserId,
                            ProductId = item.ProductId.Value,
                            CountInStock = item.Quantity
                        };
                        _context.UserProducts.Add(returnedUserProduct);
                    }

                    // Обновляем историю передачи
                    var transferHistory = await _context.TransferHistories
                        .FirstOrDefaultAsync(th => th.ProductId == item.ProductId &&
                                                 th.FromUserId == transfer.FromUserId &&
                                                 th.ToUserId == transfer.ToUserId &&
                                                 th.Status == TransferStatus.Pending);

                    if (transferHistory != null)
                    {
                        transferHistory.Status = TransferStatus.Rejected;
                        transferHistory.Message = $"Transfer rejected, items returned to sender";
                    }
                }

                transfer.Status = TransferStatus.Rejected;
                transfer.Message = $"Transfer rejected, items returned to sender";

                await _context.SaveChangesAsync();
                return Ok(new { Message = "Transfer rejected, items returned to sender", ItemsCount = transfer.TransferItems.Count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("pending/{userId}")]
        public async Task<ActionResult> GetPendingTransfers(int userId)
        {
            try
            {
                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

                if (!await _authClient.ValidateTokenAsync(token))
                    return Unauthorized();

                var currentUserId = await GetCurrentUserIdFromTokenAsync(token);

                if (userId != currentUserId)
                    return StatusCode(403, new { Message = "You don't have access to do this" });

                var pendingTransfers = await _context.Transfers
                    .Include(t => t.TransferItems)
                    .Where(t => t.ToUserId == userId && t.Status == TransferStatus.Pending)
                    .Select(t => new
                    {
                        TransferId = t.Id,
                        FromUserId = t.FromUserId,
                        ToUserId = t.ToUserId,
                        TransferDate = t.TransferDate,
                        Status = t.Status,
                        Message = t.Message,
                        Items = t.TransferItems.Select(ti => new
                        {
                            TransferItemId = ti.Id,
                            ProductId = ti.ProductId,
                            Quantity = ti.Quantity,
                            ProductName = ti.ProductName,
                            ProductDescription = ti.ProductDescription,
                            ProductImageUrl = ti.ProductImageUrl,
                            ProductPrice = ti.ProductPrice,
                            ProductOffice = ti.ProductOffice
                        }).ToList()
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
        public async Task<ActionResult> GetSentTransfers(int userId)
        {
            try
            {
                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

                if (!await _authClient.ValidateTokenAsync(token))
                    return Unauthorized();

                var currentUserId = await GetCurrentUserIdFromTokenAsync(token);

                if (userId != currentUserId)
                    return Forbid("You can only view your own sent transfers");

                var sentTransfers = await _context.Transfers
                    .Include(t => t.TransferItems)
                    .Where(t => t.FromUserId == userId)
                    .Select(t => new
                    {
                        TransferId = t.Id,
                        FromUserId = t.FromUserId,
                        ToUserId = t.ToUserId,
                        TransferDate = t.TransferDate,
                        Status = t.Status,
                        Message = t.Message,
                        Items = t.TransferItems.Select(ti => new
                        {
                            TransferItemId = ti.Id,
                            ProductId = ti.ProductId,
                            Quantity = ti.Quantity,
                            ProductName = ti.ProductName,
                            ProductDescription = ti.ProductDescription,
                            ProductImageUrl = ti.ProductImageUrl,
                            ProductPrice = ti.ProductPrice,
                            ProductOffice = ti.ProductOffice
                        }).ToList()
                    })
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

        private async Task<int> GetCurrentUserIdFromTokenAsync(string token)
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwtToken = handler.ReadJwtToken(token);
                var username = jwtToken.Claims.First(claim => claim.Type == "unique_name").Value;

                return await _authClient.GetUserIdFromTokenAsync(token);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting user ID from token: {ex.Message}");
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