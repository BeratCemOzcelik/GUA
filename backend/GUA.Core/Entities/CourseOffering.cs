namespace GUA.Core.Entities;

public class CourseOffering : BaseEntity
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public int TermId { get; set; }
    public int FacultyId { get; set; }
    public int Capacity { get; set; }
    public int EnrolledCount { get; set; } = 0;
    public string? Schedule { get; set; } // e.g., "Mon/Wed 10:00-11:30"
    public string? Location { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual Course Course { get; set; } = null!;
    public virtual AcademicTerm Term { get; set; } = null!;
    public virtual FacultyProfile Faculty { get; set; } = null!;
    public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public virtual ICollection<GradeComponent> GradeComponents { get; set; } = new List<GradeComponent>();
    public virtual ICollection<CourseMaterial> CourseMaterials { get; set; } = new List<CourseMaterial>();
}
