namespace GUA.Core.Entities;

public class Payment : BaseEntity
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string Description { get; set; } = string.Empty;
    public int Type { get; set; } // PaymentType enum
    public int Status { get; set; } // PaymentStatus enum
    public int InstallmentNumber { get; set; } // 1-6
    public int TotalInstallments { get; set; } = 6;
    public DateTime DueDate { get; set; }
    public string? SquarePaymentLinkId { get; set; }
    public string? SquarePaymentLinkUrl { get; set; }
    public string? SquareOrderId { get; set; }
    public string? SquarePaymentId { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? FailureReason { get; set; }

    // Navigation
    public virtual StudentProfile Student { get; set; } = null!;
}
