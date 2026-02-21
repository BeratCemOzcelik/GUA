namespace GUA.Core.Entities;

public class FacultyProfile : BaseEntity
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public string? Title { get; set; } // e.g., "Professor", "Associate Professor"
    public string? Bio { get; set; }
    public string? ResearchInterests { get; set; }
    public string? OfficeLocation { get; set; }
    public string? OfficeHours { get; set; }
    public string? PhotoUrl { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? GoogleScholarUrl { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual ICollection<CourseOffering> CourseOfferings { get; set; } = new List<CourseOffering>();
    public virtual ICollection<Grade> GradedGrades { get; set; } = new List<Grade>();
    public virtual ICollection<FinalGrade> PublishedFinalGrades { get; set; } = new List<FinalGrade>();
}
