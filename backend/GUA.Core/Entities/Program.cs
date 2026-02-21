using GUA.Shared.Enums;

namespace GUA.Core.Entities;

public class Program : BaseEntity
{
    public int Id { get; set; }
    public int DepartmentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DegreeType DegreeType { get; set; }
    public int TotalCreditsRequired { get; set; }
    public int DurationYears { get; set; }
    public string? Description { get; set; }
    public string? Requirements { get; set; }
    public decimal? TuitionFee { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual Department Department { get; set; } = null!;
    public virtual ICollection<StudentProfile> StudentProfiles { get; set; } = new List<StudentProfile>();
    public virtual ICollection<Application> Applications { get; set; } = new List<Application>();
}
