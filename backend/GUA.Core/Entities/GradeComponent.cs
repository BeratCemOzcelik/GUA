using GUA.Shared.Enums;

namespace GUA.Core.Entities;

public class GradeComponent : BaseEntity
{
    public int Id { get; set; }
    public int CourseOfferingId { get; set; }
    public string Name { get; set; } = string.Empty; // e.g., "Midterm Exam", "Assignment 1"
    public GradeComponentType Type { get; set; }
    public decimal Weight { get; set; } // Percentage weight (0-100)
    public decimal MaxScore { get; set; } = 100;
    public DateTime? DueDate { get; set; }
    public bool IsPublished { get; set; } = false;

    // Navigation properties
    public virtual CourseOffering CourseOffering { get; set; } = null!;
    public virtual ICollection<Grade> Grades { get; set; } = new List<Grade>();
}
