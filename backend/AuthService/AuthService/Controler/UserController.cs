
using AuthService.Context;
using AuthService.Model;
using AuthService.Services;
using AuthService.Tokens;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AuthService.Controler
{
    [Route("api/auth")]
    [ApiExplorerSettings(GroupName = "v1")]
    public class UserController : Controller
    {
        private readonly UserContext _allUsers;
        private readonly JwtTokenGenerator _jwtTokenGenerator;
        private readonly EmailService _emailService;

        public UserController(UserContext context, EmailService emailService)
        {
            _allUsers = context;
            _jwtTokenGenerator = new JwtTokenGenerator("Marsel", "Users", "abcdefghijklmnopqrstuvwxyz0123456789");
            _emailService = emailService;
        }

        [Route("login")]
        [HttpPost]
        public ActionResult login([FromForm] string Login, [FromForm] string Password)
        {
            if (string.IsNullOrEmpty(Login) || string.IsNullOrEmpty(Password))
                return StatusCode(403);

            try
            {
                Users User = _allUsers.Users.FirstOrDefault(x => x.Login == Login && x.Password == Password);
                if (User == null)
                    return StatusCode(401);

                var claims = new List<Claim> { new Claim(ClaimTypes.Name, User.Login) };
                string accessToken = _jwtTokenGenerator.GenerateAccessToken(claims, DateTime.UtcNow.AddMinutes(30));
                string refreshToken = _jwtTokenGenerator.GenerateRefreshToken();

                User.AccessToken = accessToken;
                User.RefreshToken = refreshToken;
                User.RefreshTokenExpiration = DateTime.UtcNow.AddDays(7).ToString();

                _allUsers.SaveChanges();
                return Ok(new { AccessToken = accessToken, RefreshToken = refreshToken });
            }
            catch (Exception)
            {
                return StatusCode(500);
            }
        }

        [Route("refresh")]
        [HttpPost]
        public ActionResult refresh([FromForm] string RefreshToken)
        {
            if (RefreshToken.Length == 0)
                return StatusCode(403);
            Users User = _allUsers.Users.Where(x => x.RefreshToken == RefreshToken).FirstOrDefault();
            if (User == null)
                return StatusCode(402);
            if (DateTime.Parse(User.RefreshTokenExpiration) < DateTime.UtcNow)
                return StatusCode(404);
            try
            {
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.Name, User.Login)
                };

                string accessToken = _jwtTokenGenerator.GenerateAccessToken(claims, DateTime.UtcNow.AddMinutes(30));
                string refreshToken = _jwtTokenGenerator.GenerateRefreshToken();
                User.AccessToken = accessToken;
                User.RefreshToken = refreshToken;
                User.RefreshTokenExpiration = DateTime.UtcNow.AddDays(7).ToString();
                _allUsers.SaveChanges();
                return Ok(new { AccessToken = accessToken, RefreshToken = refreshToken });
            }
            catch (Exception exp)
            {
                return StatusCode(500);
            }
        }

        [Route("forgot-password")]
        [HttpPost]
        public ActionResult forgotpassword([FromForm] string EmailOrLogin)
        {
            if (EmailOrLogin.Length == 0)
                return StatusCode(403);
            Users User = _allUsers.Users.Where(x => x.Login == EmailOrLogin).FirstOrDefault();
            if (User == null)
                return StatusCode(402);
            try
            {
                return Ok(new { Message = $"Инструкции отправлены на {EmailOrLogin}" });
            }
            catch (Exception exp)
            {
                return StatusCode(500);
            }
        }
        [Route("validate-token")]
        [HttpPost]
        public ActionResult ValidateToken([FromForm] string AccessToken)
        {
            try
            {

                if (string.IsNullOrEmpty(AccessToken) || !AccessToken.StartsWith("eyJ"))
                    return Unauthorized();

                return Ok(new { Valid = true, Message = "Token is valid" });
            }
            catch (Exception ex)
            {
                return Unauthorized();
            }
        }
        [Route("user-id")]
        [HttpGet]
        public ActionResult GetUserId([FromQuery] string username)
        {
            try
            {
                var user = _allUsers.Users.FirstOrDefault(x => x.Login == username);
                if (user == null)
                    return NotFound();

                return Ok(user.Id.ToString());
            }
            catch (Exception)
            {
                return StatusCode(500);
            }
        }
        [Route("user-email")]
        [HttpGet]
        public ActionResult GetUserEmail([FromQuery] int userId)
        {
            try
            {
                var email = _allUsers.Emails.FirstOrDefault(e => e.UserId == userId);

                if (email != null && !string.IsNullOrEmpty(email.EmailAddress))
                {
                    return Ok(email.EmailAddress);
                }

                return NotFound("Email not found for user");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting user email: {ex.Message}");
                return StatusCode(500);
            }
        }

        [Route("user-id-by-username")]
        [HttpGet]
        public ActionResult GetUserIdByUsername([FromQuery] string username)
        {
            try
            {
                var user = _allUsers.Users.FirstOrDefault(x => x.Login == username);
                if (user == null)
                    return NotFound();

                return Ok(user.Id.ToString());
            }
            catch (Exception ex)
            {
                return StatusCode(500);
            }
        }

        [Route("send-email")]
        [HttpPost]
        public async Task<ActionResult> SendEmail([FromForm] string To, [FromForm] string Subject, [FromForm] string Body)
        {
            try
            {
                await _emailService.SendEmailAsync(To, Subject, Body);

                return Ok(new { Message = "Email sent successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Failed to send email");
            }
        }

        [Route("user-exists")]
        [HttpGet]
        public ActionResult CheckUserExists([FromQuery] string userId)
        {
            try
            {
                if (int.TryParse(userId, out int id))
                {
                    var userExists = _allUsers.Users.Any(u => u.Id == id);
                    return Ok(new { exists = userExists });
                }
                return BadRequest(new { message = "Invalid user ID" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error checking user existence: {ex.Message}");
                return StatusCode(500, new { message = "Error checking user existence" });
            }
        }
        // backend/AuthService/Controller/UserController.cs
        [Route("user-id-from-token")]
        [HttpGet]
        public ActionResult GetUserIdFromToken([FromQuery] string token)
        {
            try
            {
                if (string.IsNullOrEmpty(token))
                    return BadRequest(new { message = "Token is required" });

                var handler = new JwtSecurityTokenHandler();
                var jwtToken = handler.ReadJwtToken(token);
                var usernameClaim = jwtToken.Claims.FirstOrDefault(claim => claim.Type == "unique_name");

                if (usernameClaim == null)
                    return BadRequest(new { message = "Invalid token claims" });

                var user = _allUsers.Users.FirstOrDefault(u => u.Login == usernameClaim.Value);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                return Ok(user.Id.ToString());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error getting user ID from token: {ex.Message}" });
            }
        }
        // backend/AuthService/Controller/UserController.cs
        [Route("username-by-id")]
        [HttpGet]
        public ActionResult GetUsernameById([FromQuery] int userId)
        {
            try
            {
                var user = _allUsers.Users.FirstOrDefault(u => u.Id == userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                return Ok(user.Login);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error getting username: {ex.Message}" });
            }
        }
    }
}
