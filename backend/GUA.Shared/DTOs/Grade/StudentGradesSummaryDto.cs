namespace GUA.Shared.DTOs.Grade;

public class StudentGradesSummaryDto
{
    public int EnrollmentId { get; set; }
    public int StudentId { get; set; }
    public string StudentNumber { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public int CourseOfferingId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public int Credits { get; set; }
    public string Section { get; set; } = string.Empty;
    public string TermName { get; set; } = string.Empty;
    public string FacultyName { get; set; } = string.Empty;
    public string EnrollmentStatus { get; set; } = string.Empty;
    public List<ComponentGradeDto> ComponentGrades { get; set; } = new();
    public decimal? CurrentWeightedAverage { get; set; }
    public FinalGradeDto? FinalGrade { get; set; }
}

public class ComponentGradeDto
{
    public int ComponentId { get; set; }
    public string ComponentName { get; set; } = string.Empty;
    public string ComponentType { get; set; } = string.Empty;
    public decimal Weight { get; set; }
    public decimal MaxScore { get; set; }
    public DateTime? DueDate { get; set; }
    public bool IsPublished { get; set; }
    public GradeDto? Grade { get; set; }
}
