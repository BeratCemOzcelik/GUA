namespace GUA.Shared.DTOs.BlogPost;

public class BlogPostDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public Guid AuthorUserId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string? FeaturedImageUrl { get; set; }
    public string? Tags { get; set; }
    public bool IsPublished { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
