namespace GUA.Shared.DTOs.StudentProfile;

public class UpdateMyStudentProfileDto
{
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? PhoneNumber { get; set; }
}

public class StudentChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
