using GUA.Shared.Enums;

namespace GUA.Shared.DTOs.Grade;

public class GradeComponentDto
{
    public int Id { get; set; }
    public int CourseOfferingId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public string TermName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public GradeComponentType Type { get; set; }
    public string TypeText { get; set; } = string.Empty;
    public decimal Weight { get; set; }
    public decimal MaxScore { get; set; }
    public DateTime? DueDate { get; set; }
    public bool IsPublished { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
