using GUA.Shared.Enums;

namespace GUA.Core.Entities;

public class StudentProfile : BaseEntity
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public string StudentNumber { get; set; } = string.Empty; // Auto-generated: GUA-YYYYNNNN
    public int ProgramId { get; set; }
    public DateTime EnrollmentDate { get; set; }
    public DateTime? ExpectedGraduationDate { get; set; }
    public decimal CurrentGPA { get; set; } = 0.0m;
    public int TotalCreditsEarned { get; set; } = 0;
    public AcademicStatus AcademicStatus { get; set; } = AcademicStatus.Active;
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public DateTime? DateOfBirth { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Program Program { get; set; } = null!;
    public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public virtual ICollection<GPARecord> GPARecords { get; set; } = new List<GPARecord>();
    public virtual ICollection<Transcript> Transcripts { get; set; } = new List<Transcript>();
}
