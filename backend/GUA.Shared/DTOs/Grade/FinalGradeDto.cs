namespace GUA.Shared.DTOs.Grade;

public class FinalGradeDto
{
    public int Id { get; set; }
    public int EnrollmentId { get; set; }
    public int StudentId { get; set; }
    public string StudentNumber { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public int CourseOfferingId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public int Credits { get; set; }
    public string Section { get; set; } = string.Empty;
    public string TermName { get; set; } = string.Empty;
    public string LetterGrade { get; set; } = string.Empty;
    public decimal NumericGrade { get; set; }
    public decimal GradePoints { get; set; }
    public DateTime PublishedAt { get; set; }
    public int PublishedByFacultyId { get; set; }
    public string PublishedByFacultyName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
