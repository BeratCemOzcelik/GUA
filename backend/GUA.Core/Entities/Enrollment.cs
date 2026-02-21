using GUA.Shared.Enums;

namespace GUA.Core.Entities;

public class Enrollment : BaseEntity
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public int CourseOfferingId { get; set; }
    public DateTime EnrollmentDate { get; set; }
    public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Enrolled;
    public DateTime? DropDate { get; set; }
    public DateTime? CompletionDate { get; set; }

    // Navigation properties
    public virtual StudentProfile Student { get; set; } = null!;
    public virtual CourseOffering CourseOffering { get; set; } = null!;
    public virtual ICollection<Grade> Grades { get; set; } = new List<Grade>();
    public virtual FinalGrade? FinalGrade { get; set; }
}
