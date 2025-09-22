// backend/ProductService/Services/AuthServiceClient.cs
using System.IdentityModel.Tokens.Jwt;
using System.Net;

namespace ProductService.Services
{
    public class AuthServiceClient
    {
        private readonly HttpClient _httpClient;

        public AuthServiceClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _httpClient.BaseAddress = new Uri("http://auth-service:7223");
        }

        public async Task<bool> ValidateTokenAsync(string token)
        {
            try
            {
                var formData = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("AccessToken", token)
                });

                var response = await _httpClient.PostAsync("/api/auth/validate-token", formData);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Validation error: {ex.Message}");
                return false;
            }
        }

        public async Task<int> GetUserIdFromTokenAsync(string token)
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwtToken = handler.ReadJwtToken(token);
                var username = jwtToken.Claims.First(claim => claim.Type == "unique_name").Value;

                var response = await _httpClient.GetAsync($"/api/auth/user-id-by-username?username={username}");

                if (response.IsSuccessStatusCode)
                {
                    var userIdString = await response.Content.ReadAsStringAsync();
                    if (int.TryParse(userIdString, out int userId))
                    {
                        return userId;
                    }
                }
                else if (response.StatusCode == HttpStatusCode.NotFound)
                {
                    Console.WriteLine($"User {username} not found in AuthService");
                    return -1;
                }

                Console.WriteLine($"Failed to get user ID for {username}");
                return 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetUserIdFromTokenAsync: {ex.Message}");
                return 0;
            }
        }

        // ДОБАВЬТЕ ЭТОТ МЕТОД
        public async Task<bool> GetUserExistsAsync(string userId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"/api/auth/user-exists?userId={userId}");

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    // Парсим JSON ответ
                    if (content.Contains("\"exists\":true"))
                    {
                        return true;
                    }
                }
                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error checking user existence: {ex.Message}");
                return false;
            }
        }

        public async Task<HttpResponseMessage> GetAsync(string requestUri)
        {
            return await _httpClient.GetAsync(requestUri);
        }

        public async Task<HttpResponseMessage> PostAsync(string requestUri, HttpContent content)
        {
            return await _httpClient.PostAsync(requestUri, content);
        }
    }
}