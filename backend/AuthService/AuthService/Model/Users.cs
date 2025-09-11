namespace AuthService.Model
{
    public class Users
    {
        public int Id { get; set; }
        public string Login { get; set; }
        public string Password { get; set; }
        public string RefreshToken { get; set; }
        public string AccessToken { get; set; }
        public string RefreshTokenExpiration { get; set; }
    }
}