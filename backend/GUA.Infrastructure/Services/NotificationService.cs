using GUA.Core.Entities;
using GUA.Core.Interfaces;
using GUA.Infrastructure.Data;
using GUA.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GUA.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        ApplicationDbContext context,
        IEmailService emailService,
        ILogger<NotificationService> logger)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task NotifyAsync(
        Guid recipientUserId,
        string title,
        string message,
        NotificationType type,
        string? relatedEntityType = null,
        int? relatedEntityId = null,
        string? actionUrl = null,
        bool sendEmail = true)
    {
        try
        {
            var notification = new Notification
            {
                RecipientUserId = recipientUserId,
                Title = title,
                Message = message,
                Type = type,
                RelatedEntityType = relatedEntityType,
                RelatedEntityId = relatedEntityId,
                ActionUrl = actionUrl,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            if (sendEmail)
            {
                var recipient = await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == recipientUserId);

                if (recipient != null && !string.IsNullOrWhiteSpace(recipient.Email))
                {
                    var recipientName = $"{recipient.FirstName} {recipient.LastName}".Trim();
                    var html = BuildEmailHtml(recipientName, title, message, actionUrl);
                    await _emailService.SendEmailAsync(recipient.Email, title, html);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create notification for user {UserId} (type {Type})", recipientUserId, type);
        }
    }

    private static string BuildEmailHtml(string recipientName, string title, string message, string? actionUrl)
    {
        var ctaButton = string.IsNullOrWhiteSpace(actionUrl)
            ? string.Empty
            : $@"<div style=""text-align: center; margin: 24px 0;"">
                    <a href=""{actionUrl}"" style=""background-color: #8B1A1A; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;"">View in Portal</a>
                 </div>";

        return $@"
<!DOCTYPE html>
<html>
<body style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"">
    <div style=""background-color: #8B1A1A; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;"">
        <h1 style=""color: #D4AF37; margin: 0; font-size: 22px;"">Global University America</h1>
    </div>
    <div style=""background-color: #f9f9f9; padding: 28px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;"">
        <h2 style=""color: #333; margin-top: 0;"">Hello {recipientName},</h2>
        <h3 style=""color: #8B1A1A; margin-bottom: 8px;"">{title}</h3>
        <p style=""color: #555; line-height: 1.6;"">{message}</p>
        {ctaButton}
        <p style=""color: #999; font-size: 12px; margin-top: 28px; border-top: 1px solid #e0e0e0; padding-top: 12px;"">
            This is an automated notification from Global University America. Please do not reply directly.
        </p>
    </div>
</body>
</html>";
    }
}
