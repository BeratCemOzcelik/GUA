namespace GUA.Shared.DTOs.Grade;

public class GPARecordDto
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string StudentNumber { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public int TermId { get; set; }
    public string TermName { get; set; } = string.Empty;
    public string TermCode { get; set; } = string.Empty;
    public decimal TermGPA { get; set; }
    public decimal CumulativeGPA { get; set; }
    public int TermCreditsEarned { get; set; }
    public int TotalCreditsEarned { get; set; }
    public DateTime CalculatedAt { get; set; }
}
