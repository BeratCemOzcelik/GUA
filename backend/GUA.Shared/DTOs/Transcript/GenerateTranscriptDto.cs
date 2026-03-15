namespace GUA.Shared.DTOs.Transcript;

public class GenerateTranscriptDto
{
    public int StudentId { get; set; }
    public bool IsOfficial { get; set; } = false;
}
