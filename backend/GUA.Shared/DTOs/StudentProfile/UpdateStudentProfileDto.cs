using GUA.Shared.Enums;

namespace GUA.Shared.DTOs.StudentProfile;

public class UpdateStudentProfileDto
{
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public DateTime? ExpectedGraduationDate { get; set; }
    public AcademicStatus? AcademicStatus { get; set; }
}
