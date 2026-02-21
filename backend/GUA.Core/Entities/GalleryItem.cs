namespace GUA.Core.Entities;

public class GalleryItem : BaseEntity
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? Category { get; set; } // e.g., "Campus", "Events", "Students"
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}
