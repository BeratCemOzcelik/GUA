using System.Net;
using System.Net.Mail;
using GUA.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GUA.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        try
        {
            var smtpServer = _configuration["EmailSettings:SmtpServer"] ?? "smtp-relay.brevo.com";
            var smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"] ?? "587");
            var smtpUsername = _configuration["EmailSettings:SmtpUsername"] ?? "";
            var smtpPassword = _configuration["EmailSettings:SmtpPassword"] ?? "";
            var senderEmail = _configuration["EmailSettings:FromEmail"] ?? "noreply@gua.edu.pl";
            var senderName = _configuration["EmailSettings:FromName"] ?? "Global University America";

            if (string.IsNullOrEmpty(smtpPassword))
            {
                _logger.LogWarning("SMTP password is not configured. Email not sent to {Email}", toEmail);
                return;
            }

            using var client = new SmtpClient(smtpServer, smtpPort)
            {
                Credentials = new NetworkCredential(smtpUsername, smtpPassword),
                EnableSsl = true
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            mailMessage.To.Add(toEmail);

            await client.SendMailAsync(mailMessage);
            _logger.LogInformation("Email sent successfully to {Email}: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}: {Subject}", toEmail, subject);
        }
    }

    public async Task SendApplicationConfirmationAsync(string toEmail, string applicantName, string programName)
    {
        var subject = "Application Received - Global University America";
        var htmlBody = $@"
<!DOCTYPE html>
<html>
<body style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"">
    <div style=""background-color: #8B1A1A; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;"">
        <h1 style=""color: #D4AF37; margin: 0; font-size: 24px;"">Global University America</h1>
    </div>
    <div style=""background-color: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;"">
        <h2 style=""color: #333;"">Dear {applicantName},</h2>
        <p style=""color: #555; line-height: 1.6;"">
            Thank you for applying to <strong>{programName}</strong> at Global University America.
            We have received your application and it is currently under review.
        </p>
        <p style=""color: #555; line-height: 1.6;"">
            Our admissions team will review your application and get back to you within <strong>48 hours</strong>.
        </p>
        <div style=""background-color: #fff; padding: 15px; border-radius: 8px; border-left: 4px solid #8B1A1A; margin: 20px 0;"">
            <p style=""margin: 0; color: #555;""><strong>What happens next?</strong></p>
            <ul style=""color: #555; padding-left: 20px;"">
                <li>Application review by admissions team</li>
                <li>You may be contacted for additional documents</li>
                <li>Decision notification via email</li>
            </ul>
        </div>
        <p style=""color: #555; line-height: 1.6;"">
            If you have any questions, feel free to contact us at
            <a href=""mailto:edu@gua.edu.pl"" style=""color: #8B1A1A;"">edu@gua.edu.pl</a>
        </p>
        <p style=""color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 15px;"">
            This is an automated message from Global University America. Please do not reply directly to this email.
        </p>
    </div>
</body>
</html>";

        await SendEmailAsync(toEmail, subject, htmlBody);
    }

    public async Task SendContactFormNotificationAsync(string fromEmail, string fromName, string phone, string message)
    {
        var adminEmail = _configuration["EmailSettings:NotificationEmail"] ?? "edu@gua.edu.pl";
        var subject = $"New Contact Form Message from {fromName}";
        var htmlBody = $@"
<!DOCTYPE html>
<html>
<body style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"">
    <div style=""background-color: #8B1A1A; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;"">
        <h1 style=""color: #D4AF37; margin: 0; font-size: 24px;"">New Contact Form Message</h1>
    </div>
    <div style=""background-color: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;"">
        <table style=""width: 100%; border-collapse: collapse;"">
            <tr><td style=""padding: 8px; color: #888; width: 120px;"">Name:</td><td style=""padding: 8px; color: #333; font-weight: bold;"">{fromName}</td></tr>
            <tr><td style=""padding: 8px; color: #888;"">Email:</td><td style=""padding: 8px;""><a href=""mailto:{fromEmail}"" style=""color: #8B1A1A;"">{fromEmail}</a></td></tr>
            <tr><td style=""padding: 8px; color: #888;"">Phone:</td><td style=""padding: 8px; color: #333;"">{(string.IsNullOrEmpty(phone) ? "Not provided" : phone)}</td></tr>
        </table>
        <div style=""background-color: #fff; padding: 15px; border-radius: 8px; border-left: 4px solid #8B1A1A; margin-top: 20px;"">
            <p style=""margin: 0 0 8px 0; color: #888; font-size: 12px;"">MESSAGE:</p>
            <p style=""margin: 0; color: #333; line-height: 1.6; white-space: pre-line;"">{message}</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(adminEmail, subject, htmlBody);

        // Auto-reply to sender
        var replySubject = "Thank you for contacting Global University America";
        var replyBody = $@"
<!DOCTYPE html>
<html>
<body style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"">
    <div style=""background-color: #8B1A1A; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;"">
        <h1 style=""color: #D4AF37; margin: 0; font-size: 24px;"">Global University America</h1>
    </div>
    <div style=""background-color: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;"">
        <h2 style=""color: #333;"">Dear {fromName},</h2>
        <p style=""color: #555; line-height: 1.6;"">
            Thank you for reaching out to us. We have received your message and will get back to you within <strong>48 hours</strong>.
        </p>
        <p style=""color: #555; line-height: 1.6;"">
            In the meantime, you can also reach us via WhatsApp for instant support.
        </p>
        <p style=""color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 15px;"">
            This is an automated message. Please do not reply directly to this email.
        </p>
    </div>
</body>
</html>";

        await SendEmailAsync(fromEmail, replySubject, replyBody);
    }
}
