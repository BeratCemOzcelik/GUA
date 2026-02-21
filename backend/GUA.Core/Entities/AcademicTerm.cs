namespace GUA.Core.Entities;

public class AcademicTerm : BaseEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // e.g., "Fall 2024"
    public string Code { get; set; } = string.Empty; // e.g., "2024-FALL"
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; } = false;
    public DateTime EnrollmentStartDate { get; set; }
    public DateTime EnrollmentEndDate { get; set; }

    // Navigation properties
    public virtual ICollection<CourseOffering> CourseOfferings { get; set; } = new List<CourseOffering>();
    public virtual ICollection<GPARecord> GPARecords { get; set; } = new List<GPARecord>();
}
