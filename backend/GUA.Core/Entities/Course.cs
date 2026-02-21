namespace GUA.Core.Entities;

public class Course : BaseEntity
{
    public int Id { get; set; }
    public int DepartmentId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Credits { get; set; }
    public string? Description { get; set; }
    public string? Syllabus { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual Department Department { get; set; } = null!;
    public virtual ICollection<CoursePrerequisite> PrerequisiteCourses { get; set; } = new List<CoursePrerequisite>();
    public virtual ICollection<CoursePrerequisite> DependentCourses { get; set; } = new List<CoursePrerequisite>();
    public virtual ICollection<CourseOffering> CourseOfferings { get; set; } = new List<CourseOffering>();
    public virtual ICollection<CourseMaterial> CourseMaterials { get; set; } = new List<CourseMaterial>();
}
