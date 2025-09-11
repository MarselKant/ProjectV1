using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductService.Context;
using ProductService.Models;
using ProductService.Services;

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
            [FromQuery] PaginationParams pagination,
            [FromQuery] string search = "",
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null,
            [FromQuery] int? minStock = null)
        {
            var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

            if (!await _authClient.ValidateTokenAsync(token))
                return Unauthorized();

            var query = _context.Products.AsQueryable();

            if (!string.IsNullOrEmpty(search))
                query = query.Where(p => p.Name.Contains(search) || p.Description.Contains(search));

            if (minPrice.HasValue) query = query.Where(p => p.Price >= minPrice.Value);
            if (maxPrice.HasValue) query = query.Where(p => p.Price <= maxPrice.Value);
            if (minStock.HasValue) query = query.Where(p => p.CountInStock >= minStock.Value);

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync();

            return Ok(new PagedResult<Product>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = pagination.PageNumber,
                PageSize = pagination.PageSize
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

            if (!await _authClient.ValidateTokenAsync(token))
                return Unauthorized();

            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();

            return Ok(product);
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<List<Product>>> GetUserProducts(string userId)
        {
            var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

            if (!await _authClient.ValidateTokenAsync(token))
                return Unauthorized();

            var products = await _context.Products
                .Where(p => p.UserId == userId)
                .ToListAsync();

            return Ok(products);
        }
    }
}
