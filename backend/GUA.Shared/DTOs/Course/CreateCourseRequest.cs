namespace GUA.Shared.DTOs.Course;

public class CreateCourseRequest
{
    public int DepartmentId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Credits { get; set; }
    public string? Description { get; set; }
    public string? Syllabus { get; set; }
}
