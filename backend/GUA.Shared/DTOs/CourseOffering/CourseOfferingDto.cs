namespace GUA.Shared.DTOs.CourseOffering;

public class CourseOfferingDto
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public string CourseCode { get; set; } = string.Empty;
    public int TermId { get; set; }
    public string TermName { get; set; } = string.Empty;
    public string TermCode { get; set; } = string.Empty;
    public int FacultyProfileId { get; set; }
    public string FacultyName { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public int EnrolledCount { get; set; }
    public int AvailableSeats { get; set; }
    public string? Schedule { get; set; }
    public string? Location { get; set; }
    public bool IsActive { get; set; }
    public bool IsFull { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateCourseOfferingDto
{
    public int CourseId { get; set; }
    public int TermId { get; set; }
    public int FacultyProfileId { get; set; }
    public string Section { get; set; } = "A";
    public int Capacity { get; set; }
    public string? Schedule { get; set; }
    public string? Location { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateCourseOfferingDto
{
    public int FacultyProfileId { get; set; }
    public string Section { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public string? Schedule { get; set; }
    public string? Location { get; set; }
    public bool IsActive { get; set; }
}
