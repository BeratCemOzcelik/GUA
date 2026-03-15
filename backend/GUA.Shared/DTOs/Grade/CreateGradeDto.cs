using System.ComponentModel.DataAnnotations;

namespace GUA.Shared.DTOs.Grade;

public class CreateGradeDto
{
    [Required]
    public int EnrollmentId { get; set; }

    [Required]
    public int GradeComponentId { get; set; }

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Score must be greater than or equal to 0")]
    public decimal Score { get; set; }

    public string? Comments { get; set; }
}
