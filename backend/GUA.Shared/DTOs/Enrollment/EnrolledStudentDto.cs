using GUA.Shared.Enums;

namespace GUA.Shared.DTOs.Enrollment;

public class EnrolledStudentDto
{
    public int EnrollmentId { get; set; }
    public int StudentId { get; set; }
    public string StudentNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime EnrollmentDate { get; set; }
    public EnrollmentStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public bool HasFinalGrade { get; set; }
    public string? FinalLetterGrade { get; set; }
    public decimal? FinalNumericGrade { get; set; }
}
