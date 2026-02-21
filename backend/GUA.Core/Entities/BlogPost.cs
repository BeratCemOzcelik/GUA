namespace GUA.Core.Entities;

public class BlogPost : BaseEntity
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public Guid AuthorUserId { get; set; }
    public DateTime? PublishedAt { get; set; }
    public bool IsPublished { get; set; } = false;
    public string? FeaturedImageUrl { get; set; }
    public string? Excerpt { get; set; }
    public string? Tags { get; set; } // Comma-separated

    // Navigation properties
    public virtual User Author { get; set; } = null!;
}
