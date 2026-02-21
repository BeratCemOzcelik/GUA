namespace GUA.Shared.DTOs.Gallery;

public class CreateGalleryItemRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? Category { get; set; }
    public int DisplayOrder { get; set; }
}
