namespace ProductService.Services
{
    public class EmailService
    {
        public async Task SendTransferNotificationAsync(string toUserId, string productName, int transferId)
        {
            Console.WriteLine($"Email to {toUserId}: Please accept/reject product '{productName}', Transfer ID: {transferId}");
            await Task.Delay(100);
        }
    }
}
