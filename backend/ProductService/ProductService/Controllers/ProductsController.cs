using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductService.Context;
using ProductService.Models;
using ProductService.Services;
using System.IdentityModel.Tokens.Jwt;

namespace ProductService.Controllers
{
    [ApiController]
    [Route("api/products")]
    [Authorize]
    public class ProductsController : ControllerBase
    {
        private readonly ProductContext _context;
        private readonly AuthServiceClient _authClient;

        public ProductsController(ProductContext context, AuthServiceClient authClient)
        {
            _context = context;
            _authClient = authClient;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResult<Product>>> GetProducts(
            [FromQuery(Name = "pageNumber")] int pageNumber = 1,
            [FromQuery(Name = "pageSize")] int pageSize = 10,
            [FromQuery(Name = "search")] string? search = null,
            [FromQuery(Name = "minPrice")] decimal? minPrice = null,
            [FromQuery(Name = "maxPrice")] decimal? maxPrice = null,
            [FromQuery(Name = "minStock")] int? minStock = null)
        {
            try
            {
                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

                if (!await _authClient.ValidateTokenAsync(token))
                    return Unauthorized();

                var query = _context.Products.AsQueryable();

                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(p =>
                        p.Name != null && p.Name.ToLower().Contains(search.ToLower()) ||
                        p.Description != null && p.Description.ToLower().Contains(search.ToLower()));
                }

                if (minPrice.HasValue)
                    query = query.Where(p => p.Price >= minPrice.Value);

                if (maxPrice.HasValue)
                    query = query.Where(p => p.Price <= maxPrice.Value);

                if (minStock.HasValue)
                    query = query.Where(p => p.CountInStock >= minStock.Value);

                var totalCount = await query.CountAsync();

                var items = await query
                    .OrderBy(p => p.Id)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return Ok(new PagedResult<Product>
                {
                    Items = items,
                    TotalCount = totalCount,
                    PageNumber = pageNumber,    
                    PageSize = pageSize
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            try
            {
                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

                if (!await _authClient.ValidateTokenAsync(token))
                    return Unauthorized();

                var product = await _context.Products.FindAsync(id);

                if (product == null)
                    return NotFound();
                var currentUserId = await _authClient.GetUserIdFromTokenAsync(token);

                if (product.UserId != currentUserId)
                {
                    var hasPendingTransfer = await _context.TransferHistories
                        .AnyAsync(th => th.ProductId == id &&
                                       th.ToUserId == currentUserId &&
                                       th.Status == TransferStatus.Pending);

                    if (!hasPendingTransfer)
                        return Forbid("You don't have access to this product");
                }
                return Ok(product);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<List<Product>>> GetUserProducts(int userId)
        {
            try
            {
                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

                if (!await _authClient.ValidateTokenAsync(token))
                    return Unauthorized();

                var currentUserId = await _authClient.GetUserIdFromTokenAsync(token);

                if (userId != currentUserId)
                    return Forbid("You can only view your own products");

                var products = await _context.Products
                    .Where(p => p.UserId == userId)
                    .ToListAsync();

                return Ok(products);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }

    public class PagedResult<T>
    {
        public List<T> Items { get; set; }
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
    }

}