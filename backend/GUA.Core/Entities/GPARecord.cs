namespace GUA.Core.Entities;

public class GPARecord : BaseEntity
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public int TermId { get; set; }
    public decimal TermGPA { get; set; }
    public decimal CumulativeGPA { get; set; }
    public DateTime CalculatedAt { get; set; }

    // Navigation properties
    public virtual StudentProfile Student { get; set; } = null!;
    public virtual AcademicTerm Term { get; set; } = null!;
}
