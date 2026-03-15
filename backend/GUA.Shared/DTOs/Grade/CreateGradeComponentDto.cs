using System.ComponentModel.DataAnnotations;
using GUA.Shared.Enums;

namespace GUA.Shared.DTOs.Grade;

public class CreateGradeComponentDto
{
    [Required]
    public int CourseOfferingId { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public GradeComponentType Type { get; set; }

    [Required]
    [Range(0, 100, ErrorMessage = "Weight must be between 0 and 100")]
    public decimal Weight { get; set; }

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Max score must be greater than 0")]
    public decimal MaxScore { get; set; } = 100;

    public DateTime? DueDate { get; set; }

    public bool IsPublished { get; set; } = false;
}
