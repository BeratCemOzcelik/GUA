namespace GUA.Shared.DTOs.Grade;

public class GradeDto
{
    public int Id { get; set; }
    public int EnrollmentId { get; set; }
    public int StudentId { get; set; }
    public string StudentNumber { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public int GradeComponentId { get; set; }
    public string ComponentName { get; set; } = string.Empty;
    public string ComponentType { get; set; } = string.Empty;
    public decimal ComponentWeight { get; set; }
    public decimal ComponentMaxScore { get; set; }
    public decimal Score { get; set; }
    public decimal Percentage { get; set; } // Score as percentage of max score
    public DateTime GradedAt { get; set; }
    public int GradedByFacultyId { get; set; }
    public string GradedByFacultyName { get; set; } = string.Empty;
    public string? Comments { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
