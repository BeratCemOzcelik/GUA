using System.ComponentModel.DataAnnotations;

namespace GUA.Shared.DTOs.Grade;

public class PublishFinalGradeDto
{
    [Required]
    public int EnrollmentId { get; set; }
}
