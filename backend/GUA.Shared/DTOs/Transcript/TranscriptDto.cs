namespace GUA.Shared.DTOs.Transcript;

public class TranscriptDto
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string StudentNumber { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string ProgramName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
    public string GeneratedByName { get; set; } = string.Empty;
    public string? PdfUrl { get; set; }
    public string? Hash { get; set; }
    public bool IsOfficial { get; set; }
}
