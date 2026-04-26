using GUA.Shared.Enums;

namespace GUA.Core.Interfaces;

public interface INotificationService
{
    Task NotifyAsync(
        Guid recipientUserId,
        string title,
        string message,
        NotificationType type,
        string? relatedEntityType = null,
        int? relatedEntityId = null,
        string? actionUrl = null,
        bool sendEmail = true);
}
