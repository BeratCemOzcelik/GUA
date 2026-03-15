using GUA.Shared.Enums;

namespace GUA.Shared.DTOs.Enrollment;

public class EnrollmentDto
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string StudentNumber { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public int CourseOfferingId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public int Credits { get; set; }
    public string Section { get; set; } = string.Empty;
    public string TermName { get; set; } = string.Empty;
    public string FacultyName { get; set; } = string.Empty;
    public string? Schedule { get; set; }
    public string? Location { get; set; }
    public DateTime EnrollmentDate { get; set; }
    public EnrollmentStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public DateTime? DropDate { get; set; }
    public DateTime? CompletionDate { get; set; }
    public bool HasFinalGrade { get; set; }
    public string? FinalLetterGrade { get; set; }
    public decimal? FinalNumericGrade { get; set; }
}
