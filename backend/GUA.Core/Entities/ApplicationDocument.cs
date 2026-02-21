using GUA.Shared.Enums;

namespace GUA.Core.Entities;

public class ApplicationDocument : BaseEntity
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public DocumentType DocumentType { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }

    // Navigation properties
    public virtual Application Application { get; set; } = null!;
}
