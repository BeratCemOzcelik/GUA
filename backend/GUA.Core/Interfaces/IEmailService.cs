namespace GUA.Core.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string subject, string htmlBody);
    Task SendApplicationConfirmationAsync(string toEmail, string applicantName, string programName);
    Task SendContactFormNotificationAsync(string fromEmail, string fromName, string phone, string message);
    Task SendWelcomeEmailAsync(string toEmail, string studentName, string password, string studentNumber);
}
