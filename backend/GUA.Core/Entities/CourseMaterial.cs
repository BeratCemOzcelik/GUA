namespace GUA.Core.Entities;

public class CourseMaterial : BaseEntity
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public int? CourseOfferingId { get; set; } // Nullable: can be general or specific to offering
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty; // e.g., "PDF", "PowerPoint"
    public int Version { get; set; } = 1;
    public int UploadedByFacultyId { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual Course Course { get; set; } = null!;
    public virtual CourseOffering? CourseOffering { get; set; }
    public virtual FacultyProfile UploadedBy { get; set; } = null!;
}
