namespace GUA.Core.Entities;

public class Transcript : BaseEntity
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public DateTime GeneratedAt { get; set; }
    public Guid GeneratedByUserId { get; set; }
    public string? PdfUrl { get; set; }
    public string? Hash { get; set; } // SHA256 hash for verification
    public bool IsOfficial { get; set; } = false;

    // Navigation properties
    public virtual StudentProfile Student { get; set; } = null!;
    public virtual User GeneratedBy { get; set; } = null!;
}
