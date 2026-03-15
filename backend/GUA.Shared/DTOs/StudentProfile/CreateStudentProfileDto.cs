using GUA.Shared.Enums;

namespace GUA.Shared.DTOs.StudentProfile;

public class CreateStudentProfileDto
{
    public Guid UserId { get; set; }
    public int ProgramId { get; set; }
    public DateTime EnrollmentDate { get; set; }
    public DateTime? ExpectedGraduationDate { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public DateTime? DateOfBirth { get; set; }
}
