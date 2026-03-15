using GUA.Shared.Enums;

namespace GUA.Shared.DTOs.StudentProfile;

public class StudentProfileDto
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public string UserFullName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string StudentNumber { get; set; } = string.Empty;
    public int ProgramId { get; set; }
    public string ProgramName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public DateTime EnrollmentDate { get; set; }
    public DateTime? ExpectedGraduationDate { get; set; }
    public decimal CurrentGPA { get; set; }
    public int TotalCreditsEarned { get; set; }
    public AcademicStatus AcademicStatus { get; set; }
    public string AcademicStatusText { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public int Age { get; set; }
    public DateTime CreatedAt { get; set; }
}
