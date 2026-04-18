namespace GUA.Shared.DTOs.Payment;

public class CreatePaymentRequest
{
    public int StudentId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string Description { get; set; } = string.Empty;
    public int Type { get; set; } = 1; // PaymentType: Tuition
}

public class PaymentDto
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int InstallmentNumber { get; set; }
    public int TotalInstallments { get; set; }
    public DateTime DueDate { get; set; }
    public string? PaymentUrl { get; set; }
    public string? SquareOrderId { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PaymentLinkResponse
{
    public int PaymentId { get; set; }
    public string PaymentUrl { get; set; } = string.Empty;
}

public class PaymentSummaryDto
{
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public int TotalInstallments { get; set; }
    public int PaidInstallments { get; set; }
    public List<PaymentDto> Payments { get; set; } = new();
}

public class PaymentStatsDto
{
    public decimal TotalExpected { get; set; }
    public decimal TotalCollected { get; set; }
    public decimal TotalPending { get; set; }
    public int StudentsWithPlans { get; set; }
    public int TotalPayments { get; set; }
}
