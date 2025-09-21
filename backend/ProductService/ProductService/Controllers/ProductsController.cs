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
        public async Task<ActionResult<PagedResult<ProductResponse>>> GetProducts(
            [FromQuery(Name = "pageNumber")] int pageNumber = 1,
            [FromQuery(Name = "pageSize")] int pageSize = 10,
            [FromQuery(Name = "search")] string? search = null,
            [FromQuery(Name = "minPrice")] decimal? minPrice = null,
            [FromQuery(Name = "maxPrice")] decimal? maxPrice = null)
        {
            try
            {
                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

                if (!await _authClient.ValidateTokenAsync(token))
                    return Unauthorized();

                var products = await _context.Products
                    .Select(p => new ProductResponse
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Description = p.Description,
                        ImageUrl = p.ImageUrl,
                        Price = p.Price,
                        Office = p.Office
                    })
                    .ToListAsync();

                var filteredProducts = products.AsEnumerable();

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var searchLower = search.Trim().ToLower();
                    filteredProducts = filteredProducts.Where(p =>
                        (p.Name != null && p.Name.ToLower().Contains(searchLower)) ||
                        (p.Description != null && p.Description.ToLower().Contains(searchLower)));
                }

                if (minPrice.HasValue)
                {
                    filteredProducts = filteredProducts.Where(p => p.Price >= minPrice.Value);
                }

                if (maxPrice.HasValue)
                {
                    filteredProducts = filteredProducts.Where(p => p.Price <= maxPrice.Value);
                }

                var totalCount = filteredProducts.Count();
                var items = filteredProducts
                    .OrderBy(p => p.Id)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                return Ok(new PagedResult<ProductResponse>
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
        public async Task<ActionResult<ProductResponse>> GetProduct(int id)
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

                var userProduct = await _context.UserProducts
                    .FirstOrDefaultAsync(up => up.UserId == currentUserId && up.ProductId == id);

                if (userProduct == null)
                {
                    var hasPendingTransfer = await _context.Transfers
                        .Include(t => t.TransferItems)
                        .AnyAsync(t => t.ToUserId == currentUserId &&
                                      t.Status == TransferStatus.Pending &&
                                      t.TransferItems.Any(ti => ti.ProductId == id));

                    if (!hasPendingTransfer)
                        return StatusCode(403, new { Message = "You don't have access to do this" });
                }

                var productResponse = new ProductResponse
                {
                    Id = product.Id,
                    Name = product.Name,
                    Description = product.Description,
                    ImageUrl = product.ImageUrl,
                    Price = product.Price,
                    Office = product.Office
                };

                return Ok(productResponse);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<List<UserProductResponse>>> GetUserProducts(int userId)
        {
            try
            {
                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

                if (!await _authClient.ValidateTokenAsync(token))
                    return Unauthorized();

                var currentUserId = await _authClient.GetUserIdFromTokenAsync(token);

                if (userId != currentUserId)
                    return StatusCode(403, new { Message = "You don't have access to do this" });

                var userProducts = await _context.UserProducts
                    .Include(up => up.Product)
                    .Where(up => up.UserId == userId)
                    .Select(up => new UserProductResponse
                    {
                        UserProductId = up.Id,
                        ProductId = up.Product.Id,
                        Name = up.Product.Name,
                        Description = up.Product.Description,
                        ImageUrl = up.Product.ImageUrl,
                        Price = up.Product.Price,
                        Office = up.Product.Office,
                        CountInStock = up.CountInStock
                    })
                    .ToListAsync();

                return Ok(userProducts);
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

    public class ProductResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string ImageUrl { get; set; }
        public decimal Price { get; set; }
        public string Office { get; set; }
    }

    public class UserProductResponse
    {
        public int UserProductId { get; set; }
        public int ProductId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string ImageUrl { get; set; }
        public decimal Price { get; set; }
        public string Office { get; set; }
        public int CountInStock { get; set; }
    }

}