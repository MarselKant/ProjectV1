
using Microsoft.AspNetCore.Mvc;
using AuthService.Context;
using AuthService.Model;
using AuthService.Tokens;
using System.Security.Claims;

namespace AuthService.Controler
{
    [Route("api/auth")]
    [ApiExplorerSettings(GroupName = "v1")]
    public class UserController : Controller
    {
        private readonly UserContext _allUsers;
        private readonly JwtTokenGenerator _jwtTokenGenerator;

        public UserController(UserContext context)
        {
            _allUsers = context;
            _jwtTokenGenerator = new JwtTokenGenerator("Marsel", "Users", "abcdefghijklmnopqrstuvwxyz0123456789");
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
                Console.WriteLine($"Validating token: {AccessToken}");

                if (string.IsNullOrEmpty(AccessToken) || !AccessToken.StartsWith("eyJ"))
                    return Unauthorized();

                return Ok(new { Valid = true, Message = "Token is valid" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Token validation error: {ex.Message}");
                return Unauthorized();
            }
        }
    }
}
