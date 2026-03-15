namespace GUA.Core.Entities;

/// <summary>
/// Represents a specific instance of a course being offered in a particular academic term
/// Example: CS101 offered in Fall 2026, Section A, taught by Prof. John Doe
/// </summary>
public class CourseOffering : BaseEntity
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public int TermId { get; set; }
    public int FacultyProfileId { get; set; }

    /// <summary>
    /// Section identifier (A, B, C, etc.)
    /// </summary>
    public string Section { get; set; } = "A";

    public int Capacity { get; set; }
    public int EnrolledCount { get; set; } = 0;

    /// <summary>
    /// Schedule information (e.g., "Mon/Wed 9:00-11:00")
    /// </summary>
    public string? Schedule { get; set; }

    /// <summary>
    /// Classroom or location (e.g., "Room 201", "Online")
    /// </summary>
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
