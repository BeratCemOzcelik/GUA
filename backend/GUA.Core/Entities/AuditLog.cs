namespace GUA.Core.Entities;

public class AuditLog
{
    public long Id { get; set; }
    public Guid UserId { get; set; }
    public string Action { get; set; } = string.Empty; // Create, Update, Delete
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string? OldValue { get; set; } // JSON
    public string? NewValue { get; set; } // JSON
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? IpAddress { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
}
