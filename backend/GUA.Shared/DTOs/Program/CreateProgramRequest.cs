using GUA.Shared.Enums;

namespace GUA.Shared.DTOs.Program;

public class CreateProgramRequest
{
    public int DepartmentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DegreeType DegreeType { get; set; }
    public int TotalCreditsRequired { get; set; }
    public int DurationYears { get; set; }
    public string? Description { get; set; }
    public string? Requirements { get; set; }
    public decimal? TuitionFee { get; set; }
}
