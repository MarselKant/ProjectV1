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
                Console.WriteLine($"Sending token for validation: {token}");

                var formData = new FormUrlEncodedContent(new[]
                {
            new KeyValuePair<string, string>("AccessToken", token)
        });

                var response = await _httpClient.PostAsync("/api/auth/validate-token", formData);

                Console.WriteLine($"Validation response: {response.StatusCode}");

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Validation error: {ex.Message}");
                return false;
            }
        }
    }
}
