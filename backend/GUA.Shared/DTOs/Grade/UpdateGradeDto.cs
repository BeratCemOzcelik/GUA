using System.ComponentModel.DataAnnotations;

namespace GUA.Shared.DTOs.Grade;

public class UpdateGradeDto
{
    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Score must be greater than or equal to 0")]
    public decimal Score { get; set; }

    public string? Comments { get; set; }
}
