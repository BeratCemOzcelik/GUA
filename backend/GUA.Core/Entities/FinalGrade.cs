namespace GUA.Core.Entities;

public class FinalGrade : BaseEntity
{
    public int Id { get; set; }
    public int EnrollmentId { get; set; }
    public string LetterGrade { get; set; } = string.Empty; // A, A-, B+, B, etc.
    public decimal NumericGrade { get; set; } // 0-100
    public decimal GradePoints { get; set; } // 0.0-4.0
    public DateTime PublishedAt { get; set; }
    public int PublishedByFacultyId { get; set; }

    // Navigation properties
    public virtual Enrollment Enrollment { get; set; } = null!;
    public virtual FacultyProfile PublishedByFaculty { get; set; } = null!;
}
