namespace GUA.Shared.DTOs.Enrollment;

public class AvailableCourseOfferingDto
{
    public int Id { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public int Credits { get; set; }
    public string Section { get; set; } = string.Empty;
    public string TermName { get; set; } = string.Empty;
    public string FacultyName { get; set; } = string.Empty;
    public string? Schedule { get; set; }
    public string? Location { get; set; }
    public int Capacity { get; set; }
    public int EnrolledCount { get; set; }
    public int AvailableSeats { get; set; }
    public bool IsFull { get; set; }
    public bool IsActive { get; set; }
    public bool CanEnroll { get; set; }
    public string? EnrollmentBlockReason { get; set; }
    public List<string> Prerequisites { get; set; } = new();
}
