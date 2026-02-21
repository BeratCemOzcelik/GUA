namespace GUA.Core.Entities;

public class Grade : BaseEntity
{
    public int Id { get; set; }
    public int EnrollmentId { get; set; }
    public int GradeComponentId { get; set; }
    public decimal Score { get; set; }
    public DateTime GradedAt { get; set; }
    public int GradedByFacultyId { get; set; }
    public string? Comments { get; set; }

    // Navigation properties
    public virtual Enrollment Enrollment { get; set; } = null!;
    public virtual GradeComponent GradeComponent { get; set; } = null!;
    public virtual FacultyProfile GradedByFaculty { get; set; } = null!;
}
