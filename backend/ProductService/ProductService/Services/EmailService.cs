namespace ProductService.Services
{
    public class EmailService
    {
        public async Task SendTransferNotificationAsync(string toUserId, string productCount, int transferId)
        {
            Console.WriteLine($"Email to user {toUserId}: You have received {productCount} product(s) for transfer. Transfer ID: {transferId}");
            Console.WriteLine($"Please accept or reject the transfer request.");
            await Task.Delay(100);
        }
    }
}