namespace GUA.Core.Entities;

public class Department : BaseEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual ICollection<Program> Programs { get; set; } = new List<Program>();
    public virtual ICollection<Course> Courses { get; set; } = new List<Course>();
}
